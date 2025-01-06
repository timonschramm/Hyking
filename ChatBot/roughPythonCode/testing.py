import ast

import chatbot
import main
import updatedRecommender
import json

user_query_filters = {
    "difficulty": 3,
    "max_length": 15000,
    "scenery": ["mountains"],
    "terrain": ["rocky"],
    "season": "winter",
    "facilities": ["water sources", "rest stops"],
    "min_altitude": 2000,
    "max_altitude": None
}


input= "I'm looking for a challenging hike in the Alpen during winter, around 15 km long, with stunning mountain scenery, rocky terrain, and facilities like water sources and rest stops. The altitude should go above 2,000 meters, and it should be suitable for advanced fitness levels. It should also not be too crowded."
print("ChatGpting")
#response = chatbot.parse_user_input_with_gpt(input)
responseString = "{'region': 'alpsee', 'point_lat': 47.36667, 'point_lon': 9.68333, 'difficulty': 3, 'max_length': 15000, 'min_length': 14000, 'duration_min': None, 'scenery': ['mountains'], 'terrain': ['rocky'], 'is_winter': True, 'min_altitude': 0, 'max_altitude': None, 'description_match': ['challenging', 'stunning', 'mountain', 'rocky'], 'popularity': 'low', 'season': 'winter', 'fitness_level': 'advanced', 'group_size': None, 'is_pet_friendly': None, 'facilities': ['water sources', 'rest stops']}"
#responseString="{'region': 'Ingolstadt', 'point_lat': 48.7636, 'point_lon': 11.4258, 'difficulty': 3, 'max_length': 15000, 'min_length': 15000, 'duration_min': None, 'scenery': ['mountains'], 'terrain': ['rocky'], 'is_winter': True, 'min_altitude': 2000, 'max_altitude': None, 'description_match': ['challenging', 'mountain', 'rocky', 'winter'], 'popularity': 'low', 'season': 'winter', 'fitness_level': 'advanced', 'group_size': None, 'is_pet_friendly': None, 'facilities': ['water sources', 'rest stops']}"
response = ast.literal_eval(responseString)

print(response)
print("Looking for your hikes")
top_hikes = main.getHike(response)
print(top_hikes)
