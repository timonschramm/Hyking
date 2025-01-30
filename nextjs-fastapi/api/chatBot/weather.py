import os
import requests
from dotenv import load_dotenv

# Load environment variables
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
env_path = os.path.join(project_root, ".env.local")
load_dotenv(dotenv_path=env_path)

# Get OpenWeatherMap API key from environment
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")

if not OPENWEATHERMAP_API_KEY:
    raise ValueError("❌ OPENWEATHERMAP_API_KEY is missing! Make sure it's set in the .env.local file.")

def get_weather(location: str) -> dict:
    """
    Fetch weather data for a given location using OpenWeatherMap API.
    """
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": location,
        "appid": OPENWEATHERMAP_API_KEY,
        "units": "metric"  # Use "imperial" for Fahrenheit
    }
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise ValueError(f"Failed to fetch weather data: {response.status_code} - {response.text}")