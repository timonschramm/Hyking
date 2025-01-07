import openai
import json
import os

import constants

# Ensure the API key is set
openai.api_key = constants.OpenAPIKey

# Initialize the OpenAI client
client = openai.Client(api_key=openai.api_key)


def parse_user_input_with_gpt(user_input):
    """
    Parse a hiking query into structured filters with latitude and longitude if a region is specified.
    """
    system_prompt = """
    You are a hiking recommendation assistant. Parse the user's input and return ONLY a valid JSON object with:
    - region (string, if a specific region is mentioned)
    - point_lat (latitude as float, if a location is mentioned or region is identifiable)
    - point_lon (longitude as float, if a location is mentioned or region is identifiable)
    - difficulty (1-3, where 1 is easy, 2 is medium, 3 is hard)
    - max_length (in meters)
    - min_length (in meters)
    - duration_min (in minutes)
    - scenery (array of strings, e.g., ['mountains', 'lakes'])
    - terrain (array of strings, e.g., ['rocky', 'forest'])
    - is_winter (boolean)
    - min_altitude (in meters)
    - max_altitude (in meters)
    - description_match (array of keywords from the query)
    - popularity (low, medium, high)
    - season (summer, winter, spring, fall)
    - fitness_level (beginner, intermediate, advanced)
    - group_size (small, medium, large)
    - is_pet_friendly (boolean)
    - facilities (array of strings like ['rest stops', 'water sources'])

    Your response MUST follow strict JSON formatting:
    - Do NOT include any explanations or extra text.
    - Ensure all keys and string values are enclosed in double quotes.
    - Ensure boolean values are lowercase (true/false).
    - Ensure null values are represented as null.
    - Ensure min max values are different, do not set both same value
    - Avoid trailing commas.

    Example valid JSON response:
    {
        "region": "Alps",
        "point_lat": 47.36667,
        "point_lon": 9.68333,
        "difficulty": 2,
        "max_length": 10000,
        "min_length": 5000,
        "duration_min": null,
        "scenery": ["mountains", "forest"],
        "terrain": ["rocky"],
        "is_winter": false,
        "min_altitude": 500,
        "max_altitude": 2000,
        "description_match": ["scenic", "lake"],
        "popularity": "high",
        "season": "summer",
        "fitness_level": "intermediate",
        "group_size": "small",
        "is_pet_friendly": true,
        "facilities": ["rest stops", "water sources"]
    }
    """

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.5,
        )

        # Extract and validate response
        response_content = response.choices[0].message.content.strip()
        print("Raw GPT Response:", response_content)  # Debugging line

        # Try parsing JSON
        parsed_filters = json.loads(response_content)
        return parsed_filters

    except json.JSONDecodeError:
        print("Invalid JSON in GPT response. Raw response:")
        print(response_content)
        return {}
    except Exception as e:
        print("❌ Error during GPT call:", e)
        return {}
