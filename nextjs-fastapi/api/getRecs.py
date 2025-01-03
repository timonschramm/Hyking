from fastapi import FastAPI
from pydantic import BaseModel
from recommender_system.utils import get_recommendations

app = FastAPI()

class UserRequest(BaseModel):
    userID: str

@app.get("/user/{userID}")
async def get_user(userID: str):
    # Here you would typically add logic to fetch user data
    # For now, we'll just return the userID
    return {"userID": userID}
