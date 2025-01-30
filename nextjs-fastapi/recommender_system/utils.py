import sqlite3
import numpy as np
import openai
import os
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter

# Load environment variables
load_dotenv(".env.local")

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_text_embedding(text: str, model: str = "text-embedding-ada-002") -> np.ndarray:
    """
    Calculate an embedding for the given text using OpenAI's embeddings API.

    Parameters:
    - text: Text for which the embedding will be calculated.
    - model: OpenAI embedding model to use (default is "text-embedding-ada-002").

    Returns:
    - numpy.ndarray: Array of the embedding for the given text.
    """
    try:
        response = openai.Embedding.create(
            input=text,
            model=model
        )
        embedding = np.array(response["data"][0]["embedding"])
        return embedding
    except Exception as e:
        raise ValueError(f"Failed to fetch embedding from OpenAI API: {e}")

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

def get_user_skill_embedding(user_id: str) -> np.ndarray:
    """
    Fetches the database for the user and returns an embedding of the user's hiking skills.

    Parameters:
    - user_id: ID of the user.

    Returns:
    - numpy.ndarray: Array of the embedding.
    """
    url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    attributes = ['experienceLevel', 'preferredPace', 'preferredDistance']
    response = supabase.table("Profile").select(','.join(attributes)).eq("id", user_id).execute().data[0].values()

    skill_embedding = np.array(response).reshape(1, -1)
    return skill_embedding

def get_user_direct_interest_embedding(user_id: int) -> np.ndarray:
    """
    Fetches the database for the user and returns an embedding of the user's interests.

    Parameters:
    - user_id: ID of the user.

    Returns:
    - numpy.ndarray: Array of the embedding.
    """
    url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    response = supabase.table("UserInterest").select("interestId").eq("profileId", user_id).execute().data
    user_interests = [item["interestId"] for item in response]
    response = supabase.table("Interest").select("id").execute().data
    all_interests = [item["id"] for item in response]

    interest_embedding = np.array([1 if interest in user_interests else 0 for interest in all_interests], dtype=float)
    return interest_embedding.reshape(1, -1)

def get_user_indirect_interest_embedding(user_id: int) -> np.ndarray:
    """
    Fetches the database for the user and returns an embedding of the user's interest groups.

    Parameters:
    - user_id: ID of the user.

    Returns:
    - numpy.ndarray: Array of the embedding.
    """
    url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
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

def calc_skill_similarity(user_id_a: int, user_id_b: int) -> float:
    """
    Calculates the skill similarity between two users.

    Parameters:
    - user_id_a: ID of the first user.
    - user_id_b: ID of the second user.

    Returns:
    - float: Skill similarity between the two users.
    """
    user_a_skill_embedding = get_user_skill_embedding(user_id_a)
    user_b_skill_embedding = get_user_skill_embedding(user_id_b)

    return cosine_similarity(user_a_skill_embedding, user_b_skill_embedding)[0][0]

def calc_interest_similarity(user_id_a: int, user_id_b: int) -> float:
    """
    Calculates the interest similarity between two users.

    Parameters:
    - user_id_a: ID of the first user.
    - user_id_b: ID of the second user.

    Returns:
    - float: Interest similarity between the two users.
    """
    user_a_direct_interest_embedding = get_user_direct_interest_embedding(user_id_a)
    user_b_direct_interest_embedding = get_user_direct_interest_embedding(user_id_b)
    direct_interest_sim = cosine_similarity(user_a_direct_interest_embedding, user_b_direct_interest_embedding)[0][0]

    user_a_indirect_interest_embedding = get_user_indirect_interest_embedding(user_id_a)
    user_b_indirect_interest_embedding = get_user_indirect_interest_embedding(user_id_b)
    indirect_interest_sim = cosine_similarity(user_a_indirect_interest_embedding, user_b_indirect_interest_embedding)[0][0]

    return 0.33 * direct_interest_sim + 0.67 * indirect_interest_sim

def calc_hike_description_similarity(hike_desc_a: str, hike_desc_b: str) -> float:
    """
    Calculates the similarity between two hike descriptions.

    Parameters:
    - hike_desc_a: Description of the first hike.
    - hike_desc_b: Description of the second hike.

    Returns:
    - float: Similarity between the two hikes.
    """
    hike_desc_a_embedding = get_text_embedding(hike_desc_a)
    hike_desc_b_embedding = get_text_embedding(hike_desc_b)

    return cosine_similarity(hike_desc_a_embedding, hike_desc_b_embedding)[0][0]

def calc_overall_similarity(user_id_a: int, user_id_b: int, hike_desc_a: str, hike_desc_b: str) -> float:
    """
    Calculates the overall similarity between two users and the respective hike descriptions.

    Parameters:
    - user_id_a: ID of the first user.
    - user_id_b: ID of the second user.
    - hike_desc_a: Description of the first hike.
    - hike_desc_b: Description of the second hike.

    Returns:
    - float: Overall similarity between the two users and the respective hikes.
    """
    return (0.45 * calc_skill_similarity(user_id_a, user_id_b)
            + 0.35 * calc_interest_similarity(user_id_a, user_id_b)
            + 0.2 * calc_hike_description_similarity(hike_desc_a, hike_desc_b))

def get_recommendations(user_id: int, hike_desc: str) -> list:
    """
    Calculates a list of recommendations for the user based on skill, interests, and given hike description.

    Parameters:
    - user_id: ID of the user.
    - hike_desc: Description of the hike.

    Returns:
    - list: IDs of recommended users.
    """
    url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    response = supabase.from_("Profile").select("id").neq("id", user_id).execute().data
    all_ids = [item["id"] for item in response]

    response = supabase.from_("UserSwipe").select("receiverId").eq("senderId", user_id).execute().data
    swiped_users = [item["receiverId"] for item in response]

    ids = [id for id in all_ids if id not in swiped_users]
    sim_list = []
    for id in ids:
        sim = calc_interest_similarity(user_id, id)  # TODO: Change to overall similarity
        sim_list.append((id, sim))

    sim_list.sort(key=lambda x: x[1], reverse=True)

    return [tuple[0] for tuple in sim_list[:7]]  # TODO: Change to 10

def calc_intermediate_similarity(user_id_a: str, user_id_b: str) -> float:
    """
    Calculates the intermediate similarity between the user and all other users.

    Parameters:
    - user_id_a: ID of the first user.
    - user_id_b: ID of the second user.

    Returns:
    - float: Intermediate similarity between the user and all other users.
    """
    interest_sim = calc_interest_similarity(user_id_a, user_id_b)
    skill_sim = calc_skill_similarity(user_id_a, user_id_b)
    intermediate_similarity = 0.35 * interest_sim + 0.45 * skill_sim  # TODO: Discuss weights

    return intermediate_similarity