import os
import sys
from supabase import create_client, Client
from fastapi import APIRouter

# Add the parent directory to sys.path so Python can find the recommender_system module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from .recommender_system.utils import get_recommendations


# Erstelle einen Router
router = APIRouter()


@router.get("/recommendations")
async def get_recommendation(userID: str): #TODO: Add hike_desc
    # For now, we'll just return the userID
    print("get_recommendation called in the python api")
    rec_ids = get_recommendations(userID, "") #Change
    return {"recommendedUserIDs": rec_ids}