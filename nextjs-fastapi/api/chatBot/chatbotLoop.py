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


def handle_hike_recommendation(user_input, user_id):
    """
    Handles hike recommendations dynamically and prioritizes matches across all text fields for a specific user.
    Improved to ensure filter adjustments (e.g., removing waterfalls) are applied correctly.
    """
    memory = chatbot.get_session_memory(user_id)
    user_filters = memory["conversation_state"]["user_filters"]

    try:
        # Check if the user wants to adjust existing filters
        adjust_filters_prompt = f"""
            The user has previously set the following filters: {json.dumps(user_filters)}.
            The user's new input is: {user_input}.
            Determine if the user wants to adjust, specify, or remove any of the existing filters.
            Respond with 'yes' if the user wants to adjust filters, otherwise respond with 'no'.
        """
        adjust_filters_response = chatbot._call_gpt(user_input, adjust_filters_prompt, user_id)

        if adjust_filters_response.strip().lower() == 'yes':
            # User wants to adjust filters, so update the existing filters
            update_filters_prompt = f"""
                The user has previously set the following filters: {json.dumps(user_filters)}.
                The user's new input is: {user_input}.
                Update the filters based on the user's input and return ONLY the updated filters in the following JSON format:
                {{
                    "region": "string",
                    "point_lat": "float",
                    "point_lon": "float",
                    "difficulty": "integer",
                    "max_length": "integer",
                    "min_length": "integer",
                    "duration_min": "integer",
                    "scenery": "array of strings",
                    "terrain": "array of strings",
                    "is_winter": "boolean",
                    "min_altitude": "integer",
                    "max_altitude": "integer",
                    "description_match": "array of strings",
                    "popularity": "string",
                    "season": "string",
                    "fitness_level": "string",
                    "group_size": "string",
                    "is_pet_friendly": "boolean",
                    "facilities": "array of strings"
                }}
                Your response must ONLY contain a valid JSON object. Do not include any explanations or text outside the JSON.
                If the user explicitly mentions they do not want something (e.g., "I don't care about waterfalls"), ensure that it is removed from the relevant filters (e.g., "scenery" or "description_match").
            """
            gpt_response = chatbot._call_gpt(user_input, update_filters_prompt, user_id)

            try:
                updated_filters = json.loads(gpt_response)
                user_filters.update(updated_filters)

                # Explicitly remove "waterfalls" from scenery and description_match if the user doesn't want them
                if "waterfalls" in user_input.lower():
                    if "scenery" in user_filters and "waterfalls" in user_filters["scenery"]:
                        user_filters["scenery"].remove("waterfalls")
                    if "description_match" in user_filters and "waterfalls" in user_filters["description_match"]:
                        user_filters["description_match"].remove("waterfalls")
            except json.JSONDecodeError:
                print(f"❌ GPT Response was not valid JSON: {gpt_response}")
                return {"response": "I couldn't process your request. Could you provide more details?"}
        else:
            # Extract new filters dynamically (original logic)
            system_prompt = chatbot._build_system_prompt("recommendation", user_input)
            gpt_response = chatbot._call_gpt(user_input, system_prompt, user_id)

            try:
                new_filters = json.loads(gpt_response)
                user_filters.update(new_filters)
            except json.JSONDecodeError:
                print(f"❌ GPT Response was not valid JSON: {gpt_response}")
                return {"response": "I couldn't process your request. Could you provide more details?"}

        # Automatically ignore location if not provided (original logic)
        if not user_filters.get("region"):
            user_filters.pop("region", None)

        # Fetch recommendations (original logic)
        recommendations_df = getHike.getHike(user_filters)

        if not recommendations_df.empty:
            # Ensure all text fields exist and fill missing values (original logic)
            text_fields = ["title", "teaserText", "descriptionShort", "descriptionLong"]
            for field in text_fields:
                if field not in recommendations_df.columns:
                    recommendations_df[field] = ""

            # Sort recommendations by final_score (original logic)
            recommendations_df = recommendations_df.sort_values(by="final_score", ascending=False).reset_index(drop=True)

            # Debugging output (original logic)
            print("Sorted Recommendations Sent to Frontend:\n", recommendations_df[["id", "title", "final_score"]].head())

            # Convert to dict for frontend (original logic)
            recommendations = recommendations_df.to_dict(orient="records")
            return {"response": "Here are some hikes you might like.", "hikes": recommendations}

        # No results found: Provide alternatives (original logic)
        else:
            alternative_filters = {
                "difficulty": user_filters.get("difficulty", 2),  # Default to medium
                "length": user_filters.get("max_length", 10000),  # Default max length
            }
            return {
                "response": "No hikes matched your filters. Filters like difficulty or keywords might have been too restrictive.",
                "alternatives": alternative_filters,
            }

    except Exception as e:
        print(f"❌ Error in handle_hike_recommendation: {e}")
        return {"response": "An error occurred while processing your request. Please try again later."}


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
