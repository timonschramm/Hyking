from fastapi import FastAPI
from getRecs import router as recs_router  
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Registriere den Router von getRecs.py
app.include_router(recs_router, prefix="/api", tags=["recommendations"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Alternativ spezifische URLs, z. B. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard-Root-Endpunkt
@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI API"}

# For debugging purposes
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)