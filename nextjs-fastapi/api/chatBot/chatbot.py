import openai
import json
import constants

# Ensure the API key is set
openai.api_key = constants.OpenAPIKey
client = openai.Client(api_key=openai.api_key)


class Chatbot:
    """
    A chatbot class using OpenAI API with memory and recommendation functionality.
    """

    def __init__(self):
        self.memory = {  # Memory to store conversation state and history
            "conversation_state": {"user_filters": {}, "last_context": None},
            "history": [],
        }
        print("Chatbot initialized without GPT calls")

    def get_session_memory(self):
        """Retrieve the global memory."""
        return self.memory

    def update_session_memory(self, key, value):
        """Update a specific part of the memory."""
        self.memory[key] = value

    def clear_session_memory(self):
        """Clear all memory."""
        self.memory = {"conversation_state": {"user_filters": {}, "last_context": None}, "history": []}

    def _build_system_prompt(self, mode, user_input=None):
        """
        Build the system prompt dynamically based on mode and user context.
        """
        conversation_state = self.get_session_memory()["conversation_state"]
        user_filters = conversation_state.get("user_filters", {})

        prompts = {
            "default": "You are a friendly chatbot in a hiking app. Answer user questions casually and helpfully.",
            "categorization": """
                Categorize the following user message into one of the following categories:
                - 'general_chat': General conversation or casual questions.
                - 'hike_recommendation': If specifically asking for a hike route. Not if asking for other hike related queries
                - 'clarification': For refining or clarifying a previous request.
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
                - description_match array of all words derived from input that could be important, such as ['beautiful views', 'challenging', 'easy', 'waterfall'])

                Your response must:
                - ONLY contain a valid JSON object.
                - NOT include any explanations or text outside the JSON.
                - If no information for filter is provided fill in 'None'
                - Use lowercase for boolean values (`true`/`false`).
                - Avoid trailing commas.

                User Input: {user_input}
                Current Filters: {json.dumps(user_filters, indent=2)}

                Example valid JSON:
                {{
                    "region": "Alps",
                    "difficulty": 2,
                    "max_length": 15000,
                    "is_winter": true,
                    "scenery": ["mountains", "lakes"],
                    "facilities": ["water sources"]
                }}
            """,
        }

        return prompts.get(mode, prompts["default"])

    def _call_gpt(self, user_input, system_prompt):
        """
        Unified method for interacting with GPT API.
        Sends the full conversation history along with the system prompt.
        """
        # Add user input to history
        self.memory.setdefault("history", []).append({"role": "user", "content": user_input})

        # Construct messages with system prompt and full conversation history
        messages = [{"role": "system", "content": system_prompt}] + self.memory["history"]

        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            reply = response.choices[0].message.content.strip()

            # Add assistant's response to history
            self.memory["history"].append({"role": "assistant", "content": reply})
            print("GPT Raw Response:", reply)  # Debug print
            return reply
        except Exception as e:
            print("❌ GPT API Error:", e)
            return "Sorry, I encountered an issue while generating a response. 🛠️"

    def send_recommendation_request(self, user_input):
        """
        Handle the recommendation process dynamically and prioritize description matches.
        """
        system_prompt = self._build_system_prompt("recommendation", user_input)
        gpt_response = self._call_gpt(user_input, system_prompt)

        try:
            filters = json.loads(gpt_response)
            session_memory = self.get_session_memory()

            # Automatically ignore location if not provided
            if not filters.get("region"):
                filters.pop("region", None)

            session_memory["conversation_state"]["user_filters"].update(filters)
            return filters
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {gpt_response}")
            return {"error": "The recommendation system encountered an issue. Please try again."}

    def categorize_intent(self, user_input):
        """
        Determine the intent of the user's message dynamically using history.
        """
        # Add the current user input to history temporarily for context
        self.memory["history"].append({"role": "user", "content": user_input})

        # Build the categorization prompt with history
        messages = [
                       {"role": "system", "content": self._build_system_prompt("categorization")}
                   ] + self.memory["history"]

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
            self.memory["history"].pop()
            valid_intents = ["general_chat", "hike_recommendation", "clarification", "other"]
            if intent in valid_intents:
                print(f"🧠 Detected intent: {intent}")
                return "general_chat" if intent == "other" else intent
            else:
                print(f"⚠️ Unexpected intent response: {intent}")
                return "general_chat"

        except Exception as e:
            print(f"❌ GPT API Error in categorize_intent: {e}")
            # Rollback history in case of error
            self.memory["history"].pop()
            return "general_chat"

    def send_message(self, user_input, mode="general_chat"):
        """
        Send a message to GPT and return the response.
        """
        system_prompt = self._build_system_prompt(mode)
        try:
            gpt_response = self._call_gpt(user_input, system_prompt)
            if gpt_response:
                return gpt_response.strip()
            else:
                return "I'm sorry, I couldn't process your request. Could you please try again? 🌲"
        except Exception as e:
            print(f"❌ Error in send_message: {e}")
            return "Something went wrong on my end. Please try again later! 🚨"

