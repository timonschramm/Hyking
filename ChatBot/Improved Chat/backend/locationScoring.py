import math
import pandas as pd
from rapidfuzz import fuzz

class LocationScoring:
    def __init__(self, user_filters):
        self.user_filters = user_filters

    def fuzzy_match(self, search_term, target):
        """
        Perform a fuzzy match between the search term and the target string.
        """
        if pd.isna(target):
            return 0
        return fuzz.token_sort_ratio(search_term.lower(), target.lower())

    def keyword_match(self, keywords, description):
        """
        Match keywords against a description to calculate a match score.
        """
        if not description or pd.isna(description):
            return 0
        description = description.lower()
        score = sum(20 for keyword in keywords if keyword.lower() in description)
        return min(score, 100)

    def haversine(self, lat1, lon1, lat2, lon2):
        """
        Calculate the haversine distance between two geographic points.
        """
        R = 6371  # Radius of the Earth in km
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def calculate_proximity_score(self, user_lat, user_lon, hike_lat, hike_lon):
        """
        Calculate a proximity score based on haversine distance.
        """
        if pd.isna(hike_lat) or pd.isna(hike_lon):
            return 0

        distance = self.haversine(user_lat, user_lon, hike_lat, hike_lon)
        if distance <= 10:
            return 100
        if distance <= 30:
            return 70
        if distance <= 50:
            return 50
        return 0

    def pre_filter_hikes(self, hikes_df):
        """
        Apply preliminary filters to hikes based on user preferences.
        """
        hikes_df = hikes_df.copy()

        # Length filters
        if self.user_filters.get("min_length"):
            hikes_df = hikes_df[hikes_df["length"] >= self.user_filters["min_length"]]
        if self.user_filters.get("max_length"):
            hikes_df = hikes_df[hikes_df["length"] <= self.user_filters["max_length"]]

        # Altitude filters
        if self.user_filters.get("min_altitude"):
            hikes_df = hikes_df[hikes_df["min_altitude"] >= self.user_filters["min_altitude"]]
        if self.user_filters.get("max_altitude"):
            hikes_df = hikes_df[hikes_df["max_altitude"] <= self.user_filters["max_altitude"]]

        # Pet-friendly filter
        if self.user_filters.get("is_pet_friendly"):
            hikes_df = hikes_df[hikes_df["description_long"].str.contains("pet-friendly", case=False, na=False)]

        return hikes_df

    def filter_hikes_by_location(self, hikes_df):
        """
        Apply location-based filtering and scoring to the hikes.
        """
        hikes_df = self.pre_filter_hikes(hikes_df)

        # Step 1: Fuzzy match score for region
        if self.user_filters.get("region"):
            search_term = self.user_filters["region"].lower()

            def calculate_fuzzy_score(row):
                score = 0
                for col in ["primary_region", "description_short", "description_long", "title"]:
                    if col in row and pd.notna(row[col]):
                        score += self.fuzzy_match(search_term, row[col])
                return score

            hikes_df["fuzzy_match_score"] = hikes_df.apply(calculate_fuzzy_score, axis=1)
        else:
            hikes_df["fuzzy_match_score"] = 0

        # Step 2: Keyword match score
        if self.user_filters.get("description_match"):
            keywords = self.user_filters["description_match"]
            hikes_df["description_match_score"] = hikes_df["description_long"].apply(
                lambda x: self.keyword_match(keywords, x) if pd.notna(x) else 0
            )
        else:
            hikes_df["description_match_score"] = 0

        # Step 3: Proximity score
        if self.user_filters.get("point_lat") and self.user_filters.get("point_lon"):
            hikes_df["proximity_score"] = hikes_df.apply(
                lambda row: self.calculate_proximity_score(
                    self.user_filters["point_lat"], self.user_filters["point_lon"],
                    row.get("point_lat"), row.get("point_lon")
                ), axis=1
            )
        else:
            hikes_df["proximity_score"] = 0

        # Step 4: Final region match score
        hikes_df["region_match_score"] = (
            (hikes_df["fuzzy_match_score"] * 0.7) +
            (hikes_df["proximity_score"] * 0.3)
        )

        # Step 5: Combine scores
        hikes_df["final_description_score"] = hikes_df["description_match_score"] * 0.3

        print("✅ Location-based scores calculated successfully.")
        return hikes_df
