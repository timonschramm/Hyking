import os

import pandas as pd
from dotenv import load_dotenv

import db
import supabase
from finalRecommender import FinalRecommender
from locationScoring import LocationScoring
from tabulate import tabulate

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
env_path = os.path.join(project_root, ".env.local")
load_dotenv(dotenv_path=env_path)


SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL or API Key is missing. Check your .env.local file.")

supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

def print_filtered_hikes(hikes_df):
    """
    Nicely print filtered hikes using tabulate.
    Displays all available columns from the DataFrame.
    """
    if hikes_df.empty:
        print("No hikes found matching the criteria.")
        return

    # Display top 5 hikes with all columns
    hikes_preview = hikes_df.head(5)
    print("\n🏞️ **Top Recommended Hikes:**")
    print(tabulate(
        hikes_preview,
        headers='keys',
        tablefmt='grid',
        showindex=False
    ))


# Load hike data from the database
try:
    hikes_df = db.fetch_hike_data()
    print("Columns in hikes_df:", hikes_df.columns)
    print("✅ Hike data loaded successfully!")
except Exception as e:
    print(f"❌ Error loading hike data: {e}")
    hikes_df = None



def getHike(user_filters):
    """
    Processes user filters, scores hikes, and returns top recommendations.
    """
    location_scoring = LocationScoring(user_filters)

    # Step 1: Apply location-based scoring
    hikes_with_scores = location_scoring.filter_and_score_hikes(hikes_df)

    # Step 2: Calculate final scores
    final_recommender = FinalRecommender(user_filters, hikes_with_scores)
    top_hikes = final_recommender.get_recommendations()

    # Step 3: Return top recommendations
    print("Top Recommended Hikes:\n", top_hikes[["id", "title", "final_score"]])
    return top_hikes









