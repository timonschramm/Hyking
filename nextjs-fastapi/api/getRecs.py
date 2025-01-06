#from recommender_system.utils import get_recommendation
import os
from supabase import create_client, Client
from fastapi import APIRouter

# Erstelle einen Router
router = APIRouter()


@router.get("/recommendations")
async def get_user(userID: str): #TODO: Add hike_desc
    # Here you would typically add logic to fetch user data
    # For now, we'll just return the userID

    #rec_id = get_recommendation(userID, "") #Change
    print("Function called")
    return {"recommendedUserID": "121f5b6f-6673-4b70-8434-4d9060ed2910"} #TODO: Change
