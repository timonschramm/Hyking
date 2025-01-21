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
    Handles hike recommendations using user filters and integrates with getHike.
    """
    memory = chatbot.get_session_memory()
    user_filters = memory["conversation_state"]["user_filters"]

    # Add user input to history for GPT processing
    memory["history"].append({"role": "user", "content": user_input})

    try:
        # Ask GPT to extract filters from the user input
        system_prompt = chatbot._build_system_prompt("recommendation", user_input)
        gpt_response = chatbot._call_gpt(user_input, system_prompt)

        # Update user filters based on GPT response (only use JSON parts)
        try:
            new_filters = json.loads(gpt_response)  # Parse JSON from GPT
            user_filters.update(new_filters)  # Update the filters with new ones
        except json.JSONDecodeError:
            print(f"❌ GPT Response was not valid JSON: {gpt_response}")
            return {"response": "I couldn't process your request. Could you provide more details?"}

        # Check if required filters are still missing
        required_filters = ['region', 'difficulty', 'max_length']
        missing_filters = [key for key in required_filters if not user_filters.get(key)]

        if missing_filters:
            clarification_prompt = chatbot._build_system_prompt("clarification", f"Missing filters: {', '.join(missing_filters)}.")
            clarification_response = chatbot._call_gpt(f"Missing filters: {', '.join(missing_filters)}", clarification_prompt)
            return {"response": clarification_response}

        # Fetch recommendations once all required filters are provided
        recommendations_df = main.getHike(user_filters)

        # Debugging: Print columns to ensure required fields are present
        print("Columns in recommendations_df:", recommendations_df.columns)

        if not recommendations_df.empty:
            # Safeguard against missing fields in the DataFrame
            recommendations = recommendations_df.to_dict(orient='records')
            for recommendation in recommendations:
                recommendation['description_long'] = recommendation.get('description_long', "No detailed description available.")
                recommendation['title'] = recommendation.get('title', "Untitled Hike")
                recommendation['difficulty'] = recommendation.get('difficulty', "Unknown")
                recommendation['length'] = recommendation.get('length', 0)

            return {"response": "Here are some hikes you might like.", "hikes": recommendations}
        else:
            return {"response": "No hikes match your preferences. Try adjusting your filters."}

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

