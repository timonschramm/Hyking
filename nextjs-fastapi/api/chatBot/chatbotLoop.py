import json
from .chatbot import Chatbot
from . import getHike
from . import finalRecommender
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Initialize chatbot
chatbot = Chatbot()


def chatbot_loop_api(user_input, user_id):
    """
    Main API wrapper for chatbot interactions with user-specific memory.
    Updated to handle the new 'adjust_filters' intent.
    """
    if not user_input:
        return {"error": "No input provided"}

    # Categorize user intent
    intent = chatbot.categorize_intent(user_input, user_id)

    if intent == "other":
        return handle_general_chat(user_input, user_id)

    if intent == "general_chat":
        return handle_general_chat(user_input, user_id)
    elif intent == "hike_recommendation" or intent == "adjust_filters":
        return handle_hike_recommendation(user_input, user_id)
    elif intent == "clarification":
        return handle_clarification(user_input, user_id)
    else:
        return {"response": "🤖 Sorry, I didn't understand that."}


def handle_general_chat(user_input, user_id):
    """
    Handles general conversation with the chatbot for a specific user.
    """
    general_prompt = chatbot._build_system_prompt("default", user_input)
    response = chatbot._call_gpt(user_input,general_prompt ,user_id)
    return {"response": response}


import re  # Import regex for better filtering

import re  # Import regex for better filtering

import re


def extract_keywords(user_input):
    """
    Extract important keywords from the user input that should be included in `description_match`.
    """
    # Define a list of common hiking-related keywords
    hiking_keywords = ["waterfalls", "mountains", "forest", "easy", "challenging", "scenic", "rocky", "snowy", "lake",
                       "river"]

    # Use regex to find all matching keywords in the user input
    keywords = []
    for keyword in hiking_keywords:
        if re.search(rf"\b{keyword}\b", user_input, re.IGNORECASE):
            keywords.append(keyword)

    return keywords


def handle_hike_recommendation(user_input, user_id):
    """
    Handles hike recommendations dynamically and prioritizes matches across all text fields for a specific user.
    Supports general filter adjustments (e.g., removing waterfalls, snowy terrain, etc.).
    Always returns the full list of active filters after adjustments.
    """
    memory = chatbot.get_session_memory(user_id)
    user_filters = memory["conversation_state"]["user_filters"]

    try:
        # Ensure list-based filters are initialized as empty lists
        list_based_filters = ["scenery", "terrain", "description_match", "facilities"]
        for key in list_based_filters:
            if key not in user_filters or user_filters[key] is None:
                user_filters[key] = []

        # Ensure numerical filters are initialized with default values
        numerical_filters = {
            "max_length": 15000,  # Default max length in meters
            "min_length": 0,  # Default min length in meters
            "min_altitude": 0,  # Default min altitude in meters
            "max_altitude": 10000,  # Default max altitude in meters
        }
        for key, default_value in numerical_filters.items():
            if key not in user_filters or user_filters[key] is None:
                user_filters[key] = default_value

        # Extract new filters dynamically
        system_prompt = chatbot._build_system_prompt("recommendation", user_input)
        gpt_response = chatbot._call_gpt(user_input, system_prompt, user_id)

        try:
            new_filters = json.loads(gpt_response)

            # **Fallback: Manually extract keywords and append to `description_match`**
            extracted_keywords = extract_keywords(user_input)
            if "description_match" not in new_filters:
                new_filters["description_match"] = []
            new_filters["description_match"] = list(set(new_filters["description_match"] + extracted_keywords))

            # Merge new filters with existing ones
            for key, value in new_filters.items():
                if key in list_based_filters and isinstance(value, list):
                    # Append new values to existing lists
                    user_filters[key] = list(set(user_filters[key] + value))
                else:
                    # Update other filters
                    user_filters[key] = value

        except json.JSONDecodeError:
            print(f"❌ GPT Response was not valid JSON: {gpt_response}")
            return {"response": "I couldn't process your request. Could you provide more details?"}

        # Fetch recommendations
        recommendations_df = getHike.getHike(user_filters)

        if not recommendations_df.empty:
            # Ensure all text fields exist and fill missing values
            text_fields = ["title", "teaserText", "descriptionShort", "descriptionLong"]
            for field in text_fields:
                if field not in recommendations_df.columns:
                    recommendations_df[field] = ""

            # Sort recommendations by final_score
            recommendations_df = recommendations_df.sort_values(by="final_score", ascending=False).reset_index(
                drop=True)

            # Debugging output
            print("Sorted Recommendations Sent to Frontend:\n",
                  recommendations_df[["id", "title", "final_score"]].head())

            # Convert to dict for frontend
            recommendations = recommendations_df.to_dict(orient="records")
            return {
                "response": "Here are some hikes you might like.",
                "hikes": recommendations,
                "filters": user_filters  # Include full filter list
            }

        # No results found: Provide alternatives
        else:
            alternative_filters = {
                "difficulty": user_filters.get("difficulty", 2),  # Default to medium
                "length": user_filters.get("max_length", 10000),  # Default max length
            }
            return {
                "response": "No hikes matched your filters. Filters like difficulty or keywords might have been too restrictive.",
                "alternatives": alternative_filters,
                "filters": user_filters  # Include full filter list
            }

    except Exception as e:
        print(f"❌ Error in handle_hike_recommendation: {e}")
        return {
            "response": "An error occurred while processing your request. Please try again later.",
            "filters": user_filters  # Include full filter list in error case
        }




def handle_clarification(user_input, user_id):
    """
    Handles clarification requests dynamically for a specific user.
    """
    # Clarify dynamically using the chatbot's conversation memory
    filters = chatbot.get_session_memory(user_id)["conversation_state"].get("user_filters", {})
    required_filters = ['region', 'difficulty', 'max_length']
    missing_filters = [key for key in required_filters if not filters.get(key)]

    if missing_filters:
        missing_filter = missing_filters[0]
        return {"response": f"I need more details about '{missing_filter}'. Can you clarify?"}

    # If no missing filters, treat it as general chat
    general_prompt = chatbot._build_system_prompt("default", user_input)
    response = chatbot._call_gpt(user_input, general_prompt, user_id)
    return {"response": response}
