from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbotLoop import chatbot_loop_api

app = Flask(__name__)
CORS(app)

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

        # Call chatbot loop without user_id
        response = chatbot_loop_api(user_input)
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error handling chat request: {e}")
        return jsonify({"error": "An internal error occurred"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True, use_reloader=False)
