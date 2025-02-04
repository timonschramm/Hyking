from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import timedelta
from .auth import (
    UserCreate, Token, users_db, get_password_hash,
    verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .getRecs import router as recs_router
from .chatBot.chatbotLoop import chatbot_loop_api
from .chatBot.getHike import getHike
from .chatBot.db import fetch_hike_data
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Initialize FastAPI app
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include hike recommendation router
app.include_router(recs_router, prefix="/api/py", tags=["recommendations"])

# Load hike data during startup
hikes = fetch_hike_data()
print("Hikes loaded successfully!")

# Request models
class ChatRequest(BaseModel):
    user_id: str
    user_input: str

class GroupChatRequest(BaseModel):
    user_id: str
    user_input: str

@app.post("/api/py/chat")
async def chat(request: ChatRequest):
    """
    Handle chat requests via chatbot loop with user-specific memory.
    """
    try:
        user_id = request.user_id
        user_input = request.user_input.strip()
        if not user_input:
            raise HTTPException(status_code=400, detail="No input provided")

        # Call chatbot logic with user_id
        raw_response = chatbot_loop_api(user_input, user_id)

        if isinstance(raw_response, dict) and raw_response.get("intent") == "hike_recommendation":
            # Process hike recommendations
            user_filters = raw_response.get("filters", {})
            hike_recommendations = getHike(user_filters)
            return {
                "response": "Here are some hikes you might like.",
                "hike_ids": hike_recommendations
            }

        # Return chatbot's response
        if isinstance(raw_response, str):
            return {"response": raw_response}
        else:
            return raw_response

    except Exception as e:
        print(f"Error in chatbot endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/py/groupchat")
async def groupchat(request: GroupChatRequest):
    """
    Handle group chat requests via chatbot loop with filter reset after recommendation.
    """
    try:
        user_id = request.user_id
        user_input = request.user_input.strip()
        if not user_input:
            raise HTTPException(status_code=400, detail="No input provided")

        raw_response = chatbot_loop_api(user_input, user_id, is_group_chat=True)
        # Call chatbot logic with user_id

        if isinstance(raw_response, dict) and raw_response.get("intent") == "hike_recommendation":
            # Process hike recommendations
            user_filters = raw_response.get("filters", {})
            hike_recommendations = getHike(user_filters)
            return {
                "response": "Here are some hikes you might like.",
                "hike_ids": hike_recommendations
            }

        # Return chatbot's response
        if isinstance(raw_response, str):
            return {"response": raw_response}
        else:
            return raw_response

    except Exception as e:
        print(f"Error in groupchat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/py/signup")
async def signup(user: UserCreate):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    users_db[user.email] = {"email": user.email, "password": hashed_password}
    return {"message": "User created successfully"}

@app.post("/api/py/login")
async def login(user: UserCreate):
    if user.email not in users_db:
        raise HTTPException(status_code=400, detail="Email not found")

    stored_user = users_db[user.email]
    if not verify_password(user.password, stored_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@app.get("/api/py/helloFastApi")
def hello_fast_api():
    print("helloFastApi called in the python api")
    return {"message": "Hello from FastAPI"}