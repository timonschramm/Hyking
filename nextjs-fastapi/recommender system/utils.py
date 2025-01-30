import sqlite3
import numpy as np
import requests
import os

# Hugging Face API settings
HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
HF_API_TOKEN = os.getenv("HF_API_TOKEN")  # Store your Hugging Face token in Vercel environment variables

def get_text_embedding(text: str) -> np.ndarray:
    """
    Calculate an embedding for the given text using Hugging Face's Inference API.

    Parameters:
    - text: Text for which the embedding will be calculated.

    Returns:
    - numpy.ndarray: Array of the embedding for the given text.
    """
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": text,
        "options": {"wait_for_model": True},  # Ensure the model is loaded
    }

    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload)
        response.raise_for_status()  # Raise an error for bad responses
        embedding = np.array(response.json())
        return embedding
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to fetch embedding from Hugging Face API: {e}")

def get_closest_hikes(lat: float, lon: float, radius_km: float) -> list:
    """
    Finds the hikes within a radius of the given position.

    Parameters:
    - lat: Latitude.
    - lon: Longitude.
    - radius_km: Radius in kilometers.

    Returns:
    - list: IDs of the hikes (sorted ascending by distance).
    """
    conn = sqlite3.connect("Hike_SQL.db")
    cursor = conn.cursor()

    min_lat = lat - radius_km / 111.32
    max_lat = lat + radius_km / 111.32
    min_lon = lon - radius_km / (111.32 * np.cos(np.radians(lat)))
    max_lon = lon + radius_km / (111.32 * np.cos(np.radians(lat)))

    query = """
    SELECT 
      id,
      (6371 * 2 * 
        ASIN(SQRT(
            POWER(SIN(RADIANS(latitude - ?)/2), 2) +
            COS(RADIANS(?)) * COS(RADIANS(latitude)) *
            POWER(SIN(RADIANS(longitude - ?)/2), 2)
        ))
      ) AS distance
    FROM
        start_location
    WHERE
        latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
        AND distance <= ?
    ORDER BY
        distance;
    """
    cursor.execute(query, (lat, lat, lon, min_lat, max_lat, min_lon, max_lon, radius_km))
    results = cursor.fetchall()

    cursor.close()
    conn.close()

    return results

def get_user_embedding(user_id: int) -> np.ndarray:
    """
    Fetches the database for the user and returns an embedding of the relevant attributes.

    Parameters:
    - user_id: ID of the user.

    Returns:
    - numpy.ndarray: Array of the embedding.
    """
    conn = sqlite3.connect("Hike_SQL.db")
    cursor = conn.cursor()

    attributes = ["stamina", "max_hike_time", "average_hike_time", "hike_count", "average_distance", "average_elevation_diff"]
    query = f"SELECT {', '.join(attributes)} FROM users WHERE user_id = ?"
    cursor.execute(query, (user_id,))
    user_attributes = cursor.fetchone()

    cursor.close()
    conn.close()

    if user_attributes:
        return np.array(user_attributes)
    else:
        raise ValueError("User not found")