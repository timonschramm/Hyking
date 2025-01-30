from transformers import PreTrainedModel, PreTrainedTokenizer
from sentence_transformers import SentenceTransformer
import torch
import sqlite3
import numpy as np
import math
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from collections import Counter

load_dotenv(".env.local")

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
    min_lat = lat - (radius_km / 111)
    max_lat = lat + (radius_km / 111)

    min_lon = lon - (radius_km / (111 * math.cos(math.radians(lat))))
    max_lon = lon + (radius_km / (111 * math.cos(math.radians(lat))))


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

    attributes = ["stamina", "max_hike_time", "average_hike_time", "hike_count", "average_distance", "average_elevation_diff"]

    query = f"SELECT {', '.join(attributes)} FROM users WHERE user_id = {user_id}"

    cursor.execute(query)

    user_attributes = cursor.fetchall()
    conn.close()
    user_embedding = np.array(user_attributes)
    return user_embedding

def get_user_skill_embedding(user_id:str):
    """
    Fetches the database for the user and returns an embedding of the user's hikingskills

    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
    """
    
    url:str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    attributes = ['experienceLevel','preferredPace','preferredDistance']  #TODO: Might change
    response = supabase.table("Profile").select(','.join(attributes)).eq("id", user_id).execute().data[0].values()

    skill_embedding = np.array(response).reshape(1, -1)
    return skill_embedding

def get_user_direct_interest_embedding(user_id:int):
    """
    Fetches the database for the user and returns an embedding of the user's interests

    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
    """      
    url:str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    
    response = supabase.table("UserInterest").select("interestId").eq("profileId", user_id).execute().data
    user_interests = [item["interestId"] for item in response]
    response = supabase.table("Interest").select("id").execute().data
    all_interests = [item["id"] for item in response]

    interest_embedding = np.array([1 if interest in user_interests else 0 for interest in all_interests], dtype=float)

    return interest_embedding.reshape(1, -1)

def get_user_indirect_interest_embedding(user_id:int):
    """
    Fetches the database for the user and returns an embedding of the user's interest groups

    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
    """      
    url:str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)


    response = supabase.from_("UserInterest").select("Interest(category)").eq("profileId", user_id).execute().data
    categories_response = supabase.from_("Interest").select("category").execute().data

    categories_in_user_interests = [interest['Interest']['category'] for interest in response]
    category_count = Counter(categories_in_user_interests)
    categories = sorted(list(set([category['category'] for category in categories_response])))
    result = [category_count[category] for category in categories]

    interest_embedding = np.array(result).reshape(1, -1)
    return interest_embedding

def calc_skill_similarity(user_id_a:int, user_id_b:int):
    """
    Calculates the skill similarity between two users

    Parameters:
    - user_id_a: ID of the first user
    - user_id_b: ID of the second user

    Returns:
    - float: Skill similarity between the two users
    """

    user_a_skill_embedding = get_user_skill_embedding(user_id_a)
    user_b_skill_embedding = get_user_skill_embedding(user_id_b)

    return cosine_similarity(user_a_skill_embedding, user_b_skill_embedding)[0][0]

def calc_interest_similarity(user_id_a:int, user_id_b:int):
    """
    Calculates the interest similarity between two users

    Parameters:
    - user_id_a: ID of the first user
    - user_id_b: ID of the second user

    Returns:
    - float: Interest similarity between the two users
    """
    user_a_direct_interest_embedding = get_user_direct_interest_embedding(user_id_a)
    user_b_direct_interest_embedding = get_user_direct_interest_embedding(user_id_b)
    direct_interest_sim = cosine_similarity(user_a_direct_interest_embedding, user_b_direct_interest_embedding)[0][0]

    user_a_indirect_interest_embedding = get_user_indirect_interest_embedding(user_id_a)
    user_b_indirect_interest_embedding = get_user_indirect_interest_embedding(user_id_b) 
    indirect_interest_sim = cosine_similarity(user_a_indirect_interest_embedding, user_b_indirect_interest_embedding)[0][0]

    return 0.33 * direct_interest_sim + 0.67 * indirect_interest_sim

def calc_hike_description_similarity(hike_desc_a:str, hike_desc_b:str):
    """
    Calculates the similarity between two hike descriptions

    Parameters:
    - hike_desc_a: Description of the first hike
    - hike_desc_b: Description of the second hike

    Returns:
    - float: Similarity between the two hikes
    """
    hike_desc_a_embedding = get_text_embedding(hike_desc_a)
    hike_desc_b_embedding = get_text_embedding(hike_desc_b)

    return cosine_similarity(hike_desc_a_embedding, hike_desc_b_embedding)

def calc_overall_similarity(user_id_a:int, user_id_b:int, hike_desc_a:str, hike_desc_b:str):
    """
    Calculates the overall similarity between two users and the respective hike descriptions

    Parameters:
    - user_id_a: ID of the first user
    - user_id_b: ID of the second user
    - hike_desc_a: Description of the first hike
    - hike_desc_b: Description of the second hike

    Returns:
    - float: Overall similarity between the two users and the respective hikes
    """
    return (0.45 * calc_skill_similarity(user_id_a, user_id_b) 
            + 0.35 * calc_interest_similarity(user_id_a, user_id_b) 
            + 0.2 * calc_hike_description_similarity(hike_desc_a, hike_desc_b)) #TODO: Discuss weights

def get_recommendations(user_id:int, hike_desc:str): #TODO: Implement
    """
    Calculates a list of recommendations for the user based on skill, interests and given hike description

    Parameters:
    - user_id: ID of the user
    - hike_desc: Description of the hike

    Returns:
    - list of int: IDs of recommended users
    """

    url:str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    response = supabase.from_("Profile").select("id").neq("id", user_id).execute().data
    all_ids = [item["id"] for item in response]

    response = supabase.from_("UserSwipe").select("receiverId").eq("senderId", user_id).execute().data
    swiped_users = [item["receiverId"] for item in response]

    ids = [id for id in all_ids if id not in swiped_users]
    sim_list = []
    for id in ids:
        sim = calc_interest_similarity(user_id, id) #TODO: Change to overall similarity
        sim_list.append((id, sim))

    sim_list.sort(key=lambda x: x[1], reverse=True)

    return [tuple[0] for tuple in sim_list[:7]] #TODO: Change to 10

def calc_intermediate_similarity(user_id_a:str, user_id_b:str):
    """
    Calculates the intermediate similarity between the user and all other users
    
    Parameters:
    - user_id_a: ID of the first user
    - user_id_b: ID of the second user
    
    Returns:
    - float: Intermediate similarity between the user and all other users
    """

    url:str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    interest_sim = calc_interest_similarity(user_id_a, user_id_b)
    skill_sim = calc_skill_similarity(user_id_a, user_id_b)
    intermediate_similarity = 0.35 * interest_sim + 0.45 * skill_sim #TODO: Discuss weights

    return intermediate_similarity
