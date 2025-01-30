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
            "min_length": 0,      # Default min length in meters
            "min_altitude": 0,    # Default min altitude in meters
            "max_altitude": 10000,  # Default max altitude in meters
        }
        for key, default_value in numerical_filters.items():
            if key not in user_filters or user_filters[key] is None:
                user_filters[key] = default_value

        # Check if the user wants to adjust existing filters
        adjust_filters_prompt = f"""
            The user has previously set the following filters: {json.dumps(user_filters, indent=2)}.
            The user's new input is: {user_input}.
            Determine if the user wants to adjust, specify, or remove any of the existing filters.
            Respond with 'yes' if the user wants to adjust filters, otherwise respond with 'no'.
        """
        adjust_filters_response = chatbot._call_gpt(user_input, adjust_filters_prompt, user_id)

        if adjust_filters_response.strip().lower() == 'yes':
            # User wants to adjust filters, so update the existing filters
            update_filters_prompt = f"""
                The user has previously set the following filters: {json.dumps(user_filters, indent=2)}.
                The user's new input is: {user_input}.
                Update the filters based on the user's input and return the FULL updated filters in JSON format:
                {{
                    "region": "string (if a specific region is mentioned)",
                    "point_lat": "float (latitude, if region known)",
                    "point_lon": "float (longitude, if region known)",
                    "difficulty": "integer (1=easy, 2=medium, 3=hard)",
                    "max_length": "integer (max length in meters, e.g., 15000)",
                    "min_length": "integer (min length in meters, optional)",
                    "duration_min": "integer (duration in minutes, optional)",
                    "scenery": "list of strings (e.g., ['mountains', 'forest'])",
                    "terrain": "list of strings (e.g., ['rocky', 'snowy'])",
                    "is_winter": "boolean (true/false)",
                    "min_altitude": "integer (optional, meters)",
                    "max_altitude": "integer (optional, meters)",
                    "description_match": "list of strings (e.g., ['challenging', 'easy'])",
                    "popularity": "string (low, medium, high)",
                    "season": "string (e.g., 'summer', 'winter')",
                    "fitness_level": "string (beginner, intermediate, advanced)",
                    "group_size": "string (small, medium, large)",
                    "is_pet_friendly": "boolean (true/false)",
                    "facilities": "list of strings",
                    "description_match": "list of keywords extracted from user input"
                }}
                - Ensure all filters from previous messages are included.
                - If a filter should be removed (e.g., "no waterfalls"), exclude it from the response.
                - Initialize `description_match` as an empty list if no keywords are provided.
                - Do not output any explanations, only the JSON object.
            """
            gpt_response = chatbot._call_gpt(user_input, update_filters_prompt, user_id)

            try:
                updated_filters = json.loads(gpt_response)
                user_filters.update(updated_filters)

                # **NEW: Remove unwanted items dynamically**
                unwanted_items = re.findall(r"don't want (\w+)|no (\w+)", user_input.lower())
                if unwanted_items:
                    for item in unwanted_items:
                        unwanted_feature = item[0] or item[1]  # Extract non-empty match
                        for filter_category in ["scenery", "description_match", "terrain"]:
                            if filter_category in user_filters and unwanted_feature in user_filters[filter_category]:
                                user_filters[filter_category].remove(unwanted_feature)

            except json.JSONDecodeError:
                print(f"❌ GPT Response was not valid JSON: {gpt_response}")
                return {"response": "I couldn't process your request. Could you provide more details?"}
        else:
            # Extract new filters dynamically
            system_prompt = chatbot._build_system_prompt("recommendation", user_input)
            gpt_response = chatbot._call_gpt(user_input, system_prompt, user_id)

            try:
                new_filters = json.loads(gpt_response)
                user_filters.update(new_filters)
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
            recommendations_df = recommendations_df.sort_values(by="final_score", ascending=False).reset_index(drop=True)

            # Debugging output
            print("Sorted Recommendations Sent to Frontend:\n", recommendations_df[["id", "title", "final_score"]].head())

            # Convert to dict for frontend
            recommendations = recommendations_df.to_dict(orient="records")
            return {
                "response": "Here are some hikes you might like.",
                "hikes": recommendations,
                "filters": user_filters  # **NEW: Include full filter list**
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
                "filters": user_filters  # **NEW: Include full filter list**
            }

    except Exception as e:
        print(f"❌ Error in handle_hike_recommendation: {e}")
        return {
            "response": "An error occurred while processing your request. Please try again later.",
            "filters": user_filters  # **NEW: Include full filter list in error case**
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
