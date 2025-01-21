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
    Processes user filters, fetches recommended hikes, and integrates image data.
    """
    print("🛠️ User filters received:", user_filters)
    location_scoring = LocationScoring(user_filters)

    # Step 1: Filter hikes based on location scoring
    hikes_with_location_scores = location_scoring.filter_hikes_by_location(hikes_df)

    # Step 2: Create FinalRecommender object
    final_recommender = FinalRecommender(user_filters, hikes_with_location_scores)

    # Step 3: Get the final recommendations based on all factors
    final_recommended_hikes = final_recommender.get_recommendations()

    # Step 4: Display columns in the recommended DataFrame
    print("Columns in final_recommended_hikes:", final_recommended_hikes.columns)

    # Step 5: Query the Supabase Image table for image IDs
    try:
        # Fetch image data from the Image table
        response = supabase.table("Image").select("*").filter("activityId", "in", final_recommended_hikes['id'].tolist()).execute()
        if not response.data:
            print("No image data found for the recommended hikes.")
            image_data = pd.DataFrame()  # Empty DataFrame if no images are found
        else:
            image_data = pd.DataFrame(response.data)
    except Exception as e:
        print(f"❌ Error fetching image data: {e}")
        image_data = pd.DataFrame()  # Return an empty DataFrame on failure

    # Step 6: Merge the image data with the recommended hikes
    if not final_recommended_hikes.empty:
        if not image_data.empty:
            final_recommended_hikes = final_recommended_hikes.merge(image_data, left_on="id", right_on="activityId", how="left")
        print("Final recommendations with images:", final_recommended_hikes)
        if 'description_long' not in final_recommended_hikes.columns:
            final_recommended_hikes['description_long'] = "No detailed description available."

        return final_recommended_hikes
    else:
        print("No matching hike recommendations found.")
        return pd.DataFrame()








