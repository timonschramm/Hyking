import numpy as np
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from collections import Counter

load_dotenv(".env.local")


def get_user_skill_embedding(user_id: str):
    """
    Fetches the database for the user and returns an embedding of the user's hikingskills

    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
    """

    url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    supabase: Client = create_client(url, key)

    response = supabase.table("UserSkill").select("SkillLevel(numericValue, name)").eq("profileId", user_id).neq(
        "SkillLevel.name", "CAR").neq("SkillLevel.name", "PUBLIC TRANSPORTATION").neq("SkillLevel.name",
                                                                                      "BOTH").execute().data

    skills = [item['SkillLevel']['numericValue'] for item in response if item['SkillLevel'] is not None]
    skill_embedding = np.array(skills).reshape(1, -1)
    return skill_embedding


def get_user_direct_interest_embedding(user_id: int):
    """
    Fetches the database for the user and returns an embedding of the user's interests

    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
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


def get_user_indirect_interest_embedding(user_id: int):
    """
    Fetches the database for the user and returns an embedding of the user's interest groups

    Parameters:
    - user_id: ID of the user

    Returns:
    - numpy Array: Array of the embedding
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


def calc_skill_similarity(user_id_a: int, user_id_b: int):
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

    try:
        return cosine_similarity_numpy(user_a_skill_embedding, user_b_skill_embedding)[0][0]
    except Exception:
        return 0


def calc_interest_similarity(user_id_a: int, user_id_b: int):
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
    direct_interest_sim = \
    cosine_similarity_numpy(user_a_direct_interest_embedding, user_b_direct_interest_embedding)[0][0]

    user_a_indirect_interest_embedding = get_user_indirect_interest_embedding(user_id_a)
    user_b_indirect_interest_embedding = get_user_indirect_interest_embedding(user_id_b)
    indirect_interest_sim = \
    cosine_similarity_numpy(user_a_indirect_interest_embedding, user_b_indirect_interest_embedding)[0][0]

    return 0.33 * direct_interest_sim + 0.67 * indirect_interest_sim


def cosine_similarity_numpy(vec1, vec2):
    # Flatten if 2D (assumes shape (1, N))
    vec1, vec2 = vec1.flatten(), vec2.flatten()

    # Handle empty vectors (return similarity of 0)
    if vec1.size == 0 or vec2.size == 0:
        return 0.0

    # Compute dot product and norms
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)

    # Handle division by zero
    return dot_product / (norm_vec1 * norm_vec2) if norm_vec1 * norm_vec2 != 0 else 0.0


def calc_overall_similarity(user_id_a: int, user_id_b: int, hike_desc_a: str, hike_desc_b: str):
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
    return (0.66 * calc_skill_similarity(user_id_a, user_id_b)
            + 0.34 * calc_interest_similarity(user_id_a, user_id_b))  # TODO: Discuss weights


def get_recommendations(user_id: int, hike_desc: str):
    """
    Calculates a list of recommendations for the user based on skill, interests and given hike description

    Parameters:
    - user_id: ID of the user
    - hike_desc: Description of the hike

    Returns:
    - list of int: IDs of recommended users
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
        sim = calc_overall_similarity(user_id, id)
        sim_list.append((id, sim))

    sim_list.sort(key=lambda x: x[1], reverse=True)

    return [tuple[0] for tuple in sim_list[:10]]

