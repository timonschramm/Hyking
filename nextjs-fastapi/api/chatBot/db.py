import pandas as pd
from supabase import create_client
import os
from dotenv import load_dotenv

# Explicitly load the environment file
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
env_path = os.path.join(project_root, ".env.local")
load_dotenv(dotenv_path=env_path)

# Initialize Supabase client using environment variables
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL or API Key is missing. Check your .env.local file.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_hike_data():
    """
    Fetch hike data from the Supabase 'Activity' table.
    """
    try:
        response = supabase.table("Activity").select("*").execute()
        if not response.data:
            raise Exception(f"Supabase query returned no data. Response: {response}")
        # Convert data to a DataFrame
        return pd.DataFrame(response.data)
    except Exception as e:
        print(f"❌ Error fetching hike data: {e}")
        return pd.DataFrame()  # Return an empty DataFrame on failure

