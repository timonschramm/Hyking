import json
from chatbot import Chatbot
import main
import finalRecommender

# Initialize chatbot
chatbot = Chatbot()


def chatbot_loop_api(user_input):
    """
    Main API wrapper for chatbot interactions.
    """
    if not user_input:
        return {"error": "No input provided"}

    # Categorize user intent
    intent = chatbot.categorize_intent(user_input)

    if intent == "other":
        return handle_general_chat(user_input)

    if intent == "general_chat":
        return handle_general_chat(user_input)
    elif intent == "hike_recommendation":
        return handle_hike_recommendation(user_input)
    elif intent == "clarification":
        return handle_clarification(user_input)
    else:
        return {"response": "🤖 Sorry, I didn't understand that."}


def handle_general_chat(user_input):
    """
    Handles general conversation with the chatbot.
    """
    response = chatbot.send_message(user_input, mode="general_chat")
    return {"response": response}


def handle_hike_recommendation(user_input):
    """
    Handles hike recommendations dynamically and prioritizes matches across all text fields.
    """
    memory = chatbot.get_session_memory()
    user_filters = memory["conversation_state"]["user_filters"]

    try:
        # Extract filters dynamically
        system_prompt = chatbot._build_system_prompt("recommendation", user_input)
        gpt_response = chatbot._call_gpt(user_input, system_prompt)

        try:
            new_filters = json.loads(gpt_response)
            user_filters.update(new_filters)

            # Automatically ignore location if not provided
            if not user_filters.get("region"):
                user_filters.pop("region", None)
        except json.JSONDecodeError:
            print(f"❌ GPT Response was not valid JSON: {gpt_response}")
            return {"response": "I couldn't process your request. Could you provide more details?"}

        # Fetch recommendations
        recommendations_df = main.getHike(user_filters)

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
            return {"response": "Here are some hikes you might like.", "hikes": recommendations}

        # No results found: Provide alternatives
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















def handle_clarification(user_input):
    """
    Handles clarification requests dynamically.
    """
    # Clarify dynamically using the chatbot's conversation memory
    filters = chatbot.get_session_memory()["conversation_state"].get("user_filters", {})
    required_filters = ['region', 'difficulty', 'max_length']
    missing_filters = [key for key in required_filters if not filters.get(key)]

    if missing_filters:
        missing_filter = missing_filters[0]
        return {"response": f"I need more details about '{missing_filter}'. Can you clarify?"}

    # If no missing filters, treat it as general chat
    return {"response": chatbot.send_message(user_input)}

