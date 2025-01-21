from flask import Flask, request, jsonify
from flask_cors import CORS

from db import fetch_hike_data
from chatbotLoop import chatbot_loop_api
from main import getHike

app = Flask(__name__)
CORS(app)  # Ensure frontend can connect to the backend


@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat requests.
    """
    try:
        # Parse incoming JSON data
        data = request.get_json()
        print(f"Incoming request data: {data}")  # Debugging

        user_input = data.get("user_input", "").strip()

        if not user_input:
            print("❌ Missing 'user_input'")
            return jsonify({"error": "No input provided"}), 400

        # Call chatbot loop without user_id to process user input
        raw_response = chatbot_loop_api(user_input)

        # Check if the chatbot's response requires hike recommendations
        if isinstance(raw_response, dict) and raw_response.get("intent") == "hike_recommendation":
            # Extract user filters from chatbot response
            user_filters = raw_response.get("filters", {})

            # Get hike recommendations (IDs only)
            recommended_hike_ids = getHike(user_filters)
            print(f"Recommended hike IDs: {recommended_hike_ids}")  # Debugging

            # Return hike IDs along with a success message
            return jsonify({
                "response": "Here are some hikes you might like.",
                "hike_ids": recommended_hike_ids
            })

        # Default: Return the raw response from the chatbot
        if isinstance(raw_response, str):
            return jsonify({"response": raw_response})
        elif isinstance(raw_response, dict):
            return jsonify(raw_response)
        else:
            return jsonify({"error": "Unexpected response format"}), 500

    except Exception as e:
        print(f"❌ Error handling chat request: {e}")
        return jsonify({"error": "An internal error occurred"}), 500



if __name__ == '__main__':
    hikes = fetch_hike_data()
    print(hikes)
    app.run(host='0.0.0.0', port=5003, debug=True, use_reloader=False)
