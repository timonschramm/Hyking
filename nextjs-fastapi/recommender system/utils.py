from transformers import PreTrainedModel, PreTrainedTokenizer
from sentence_transformers import SentenceTransformer
import torch
import sqlite3
import numpy as np

def get_text_embedding(text:str, model, tokenizer, avg:bool):
    """
    Calculate an embedding for the given text using the specified model

    Parameters:
    - text: Text for which the embedding will be calculated
    - model: Language model used for the embedding
    - tokenizer: According tokenizer for the model
    - avg: If the cls embedding is used or if the embeddings are averaged

    Returns:
    - numpy Array: Array of the embedding for the given text
    """
    if isinstance(model, SentenceTransformer):
        return torch.tensor(model.encode(text, convert_to_tensor=True)).numpy()
    elif isinstance(model, PreTrainedModel) and isinstance(tokenizer, PreTrainedTokenizer):
        input = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

        with torch.no_grad():
            output = model(**input)

        if avg:
            embedding = output.last_hidden_state.mean(dim=1)
        else:
            embedding = output.last_hidden_state[:, 0, :]
        
        return embedding.numpy()
    else:
        ValueError("Model or Tokenizer invalidlse:VaModel or Tokenizer invalid")

def get_closest_hikes(lat:int, lon:int, radius_km:int):
    """
    Finds the hikes within radius of given position

    Parameters:
    - lat: Latitude
    - lon: Longitude
    - radius_km: Radius in kilometers

    Returns:
    - list: IDs of the hikes (sorted ascending by distance) 
    """
    conn = sqlite3.connect("Hike_SQL.db")
    cursor = conn.cursor()

    # Calculate a bounding box to reduce num number of hike distances that are calculated
    # TODO: change radius_km calculation by dividing by the right number
    min_lat = lat - radius_km
    max_lat = lat + radius_km

    min_lon = lon - radius_km
    max_lon = lon + radius_km


    query = """ 
    SELECT 
      id,

      -- Calculating the Haversine Distance 
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

    cursor.execute(query, (lat, lat, lon, min_lat, max_lat, min_lon, max_lon, radius_km, ))
    results = cursor.fetchall()

    cursor.close()
    conn.close()

    return results
     

def get_user_embedding(user_id:int):
    """
    Fetches the database for the user and returns an embedding of the relevant attributes
    
    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
    """

    conn = sqlite3.connect("Hike_SQL.db")
    cursor = conn.cursor()

    attributes = ["stamina", "max_hike_time", "average_hike_time", "hike_count", "average_distance", "average_elevation_diff"] #TODO: Adjust attributes

    query = f"SELECT {', '.join(attributes)} FROM users WHERE user_id = {user_id}"

    cursor.execute(query)

    user_attributes = cursor.fetchall()
    conn.close()
    user_embedding = np.array(user_attributes)
    return user_embedding
