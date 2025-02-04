import openai
import json
import os
from dotenv import load_dotenv
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
env_path = os.path.join(project_root, ".env.local")
load_dotenv(dotenv_path=env_path)

# Get API key from environment
openai_api_key = os.getenv("OPENAI_API_KEY")

if not openai_api_key:
    raise ValueError("❌ OPENAI_API_KEY is missing! Make sure it's set in the .env.local file.")

# Correctly initialize OpenAI client with the retrieved key
client = openai.Client(api_key=openai_api_key)


class Chatbot:
    """
    A chatbot class using OpenAI API with memory and recommendation functionality.
    Supports user-specific memory using user_id.
    """

    def __init__(self):
        # User-specific memory storage
        self.user_memory = {}
        print("Chatbot initialized with support for user-specific memory")

    def get_session_memory(self, user_id):
        """
        Retrieve memory for a specific user.
        If no memory exists for the user, initialize it.
        """
        if user_id not in self.user_memory:
            self.user_memory[user_id] = {
                "conversation_state": {"user_filters": {}, "last_context": None},
                "history": [],
            }
        return self.user_memory[user_id]

    def update_session_memory(self, user_id, key, value):
        """
        Update a specific part of the memory for a user.
        """
        memory = self.get_session_memory(user_id)
        memory[key] = value

    def clear_session_memory(self, user_id):
        """
        Clear all memory for a specific user.
        """
        if user_id in self.user_memory:
            self.user_memory[user_id] = {
                "conversation_state": {"user_filters": {}, "last_context": None},
                "history": [],
            }

    def _build_system_prompt(self, mode, user_input=None):
        """
        Build the system prompt dynamically based on mode and user context.
        """
        prompts = {
            "default": "You are a friendly chatbot in a hiking app. Answer user questions casually and helpfully.",
            "categorization": """
            Categorize the following user message into one of the following categories:
            - 'general_chat': General conversation or casual questions.
            - 'hike_recommendation': If the user is asking for a hike route or adjusting/refining their preferences (e.g., changing difficulty, scenery, etc.).
            - 'clarification': Before this messages hikes may have already been recommended. If the request is asking specifically for information of a hike route that may have been provided earlier in the chat use this.
            - 'adjust_filters': If the user is explicitly updating or changing their filters (e.g., "I don't care about waterfalls, only easy hikes").
            - 'weather': If the user is asking about the weather (e.g., "What's the weather in New York?").
            - 'other': Anything else unrelated or unclear.

            Respond ONLY with the category name, no explanations.
            """,
            "recommendation": f"""
                You are a hiking recommendation assistant.
                Parse the user's input and return ONLY a valid JSON object with:
                - region (string, if a specific region is mentioned)
                - point_lat (latitude as float, calculate this if not specified and region known)
                - point_lon (longitude as float, calculate this if not specified and region known)
                - difficulty (integer, 1-3 where 1 is easy, 2 is medium, 3 is hard)
                - max_length (integer, in meters, e.g., 15000)
                - min_length (integer, in meters, optional)
                - duration_min (integer, in minutes, optional)
                - scenery (array of strings, e.g., ['mountains', 'forest'])
                - terrain (array of strings, e.g., ['rocky', 'snowy'])
                - is_winter (boolean, true if hike is in winter, otherwise false)
                - min_altitude (integer, in meters, optional)
                - max_altitude (integer, in meters, optional)
                - description_match (array of keywords, e.g., ['challenging', 'easy'])
                - popularity (string, one of 'low', 'medium', 'high')
                - season (string, e.g., 'summer', 'winter')
                - fitness_level (string, one of 'beginner', 'intermediate', 'advanced')
                - group_size (string, one of 'small', 'medium', 'large')
                - is_pet_friendly (boolean, true or false)
                - facilities (array of strings)

                Your response must:
                - Include ALL important keywords from the user input in `description_match`, even if they are already part of other filters (e.g., "waterfalls" should be in `description_match` even if it's also in `scenery`).
                - If the user uses words like "about," "approximately," or "around" for numerical values, apply a ±20% range around the specified value and set both min and max values.
                - ONLY contain a valid JSON object.
                - NOT include any explanations or text outside the JSON.
                - Use lowercase for boolean values (`true`/`false`).
                - Avoid trailing commas.

                User Input: {user_input}
            """,
        }
        return prompts.get(mode, prompts["default"])

    def _call_gpt(self, user_input, system_prompt, user_id):
        """
        Unified method for interacting with GPT API.
        Sends the full conversation history along with the system prompt for a specific user.
        """
        # Get user-specific memory
        memory = self.get_session_memory(user_id)

        # Add user input to history
        memory.setdefault("history", []).append({"role": "user", "content": user_input})

        # Construct messages with system prompt and full conversation history
        messages = [{"role": "system", "content": system_prompt}] + memory["history"]

        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            reply = response.choices[0].message.content.strip()

            # Add assistant's response to history
            memory["history"].append({"role": "assistant", "content": reply})
            print("GPT Raw Response:", reply)  # Debug print
            return reply
        except Exception as e:
            print("❌ GPT API Error:", e)
            return "Sorry, I encountered an issue while generating a response. 🛠️"

    def categorize_intent(self, user_input, user_id):
        """
        Determine the intent of the user's message dynamically using history.
        Improved to handle cases where the user is adjusting or refining filters.
        """
        memory = self.get_session_memory(user_id)

        # Add the current user input to history temporarily for context
        memory["history"].append({"role": "user", "content": user_input})

        # Build the categorization prompt with history
        messages = [
            {"role": "system", "content": self._build_system_prompt("categorization")},
            {"role": "user", "content": user_input},
        ]

        try:
            # Call GPT to determine intent
            response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=messages,
                max_tokens=10,
                temperature=0.0,
            )
            intent = response.choices[0].message.content.strip().lower()

            # Validate the response and remove temporary history
            memory["history"].pop()
            valid_intents = ["general_chat", "hike_recommendation", "clarification", "adjust_filters", "weather",
                             "other"]
            if intent in valid_intents:
                print(f"🧠 Detected intent: {intent}")
                return intent
            else:
                print(f"⚠️ Unexpected intent response: {intent}")
                return "general_chat"

        except Exception as e:
            print(f"❌ GPT API Error in categorize_intent: {e}")
            # Rollback history in case of error
            memory["history"].pop()
            return "general_chat"
