import math
import pandas as pd
from rapidfuzz import fuzz


class LocationScoring:
    def __init__(self, user_filters):
        self.user_filters = user_filters

    def keyword_match(self, keywords, text_fields, threshold=70):
        """
        Match keywords across multiple text fields and compute a match score.
        """
        score = 0
        for keyword in keywords:
            for text in text_fields:
                if pd.notna(text):
                    similarity = fuzz.partial_ratio(keyword.lower(), text.lower())
                    if similarity >= threshold:
                        score += (similarity / 100) * 20  # Scale score
        return min(score, 100)  # Cap score at 100

    def haversine(self, lat1, lon1, lat2, lon2):
        """
        Calculate the haversine distance between two geographic points.
        """
        R = 6371  # Earth radius in km
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def calculate_proximity_score(self, user_lat, user_lon, hike_lat, hike_lon):
        """
        Calculate proximity score based on haversine distance.
        """
        if pd.isna(hike_lat) or pd.isna(hike_lon):
            return 0

        distance = self.haversine(user_lat, user_lon, hike_lat, hike_lon)
        if distance <= 10:
            return 100
        elif distance <= 30:
            return 70
        elif distance <= 50:
            return 50
        return 0

    def filter_and_score_hikes(self, hikes_df):
        """
        Apply filters and calculate keyword and proximity scores.
        """
        hikes_df = hikes_df.copy()

        # Keyword match scoring
        if self.user_filters.get("description_match"):
            keywords = self.user_filters["description_match"]
            hikes_df["keyword_score"] = hikes_df.apply(
                lambda row: self.keyword_match(
                    keywords, [row.get("title", ""), row.get("descriptionLong", "")]
                ), axis=1
            )
        else:
            hikes_df["keyword_score"] = 0

        # Proximity scoring
        if self.user_filters.get("point_lat") and self.user_filters.get("point_lon"):
            user_lat = self.user_filters["point_lat"]
            user_lon = self.user_filters["point_lon"]
            hikes_df["proximity_score"] = hikes_df.apply(
                lambda row: self.calculate_proximity_score(
                    user_lat, user_lon, row.get("pointLat"), row.get("pointLon")
                ), axis=1
            )
        else:
            hikes_df["proximity_score"] = 0

        return hikes_df
