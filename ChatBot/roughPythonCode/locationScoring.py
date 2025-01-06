import math

import pandas as pd
from rapidfuzz import fuzz

from rapidfuzz import fuzz
from collections import Counter


class LocationScoring:
    def __init__(self, user_filters):
        self.user_filters = user_filters

    def fuzzy_match(self, search_term, target):
        if pd.isna(target):
            return 0
        # Using token_sort_ratio for better matching that is insensitive to word order
        return fuzz.token_sort_ratio(search_term.lower(), target.lower())

    def keyword_match(self, keywords, description):
        # Lowercase the description and keywords to ensure case-insensitive matching
        description = description.lower()
        score = 0
        for keyword in keywords:
            if keyword.lower() in description:
                score += 20  # You can adjust this value based on how important the keyword is
        return min(score, 100)  # Cap the score at 100

    def haversine(self, lat1, lon1, lat2, lon2):
        R = 6371  # Radius of the Earth in km
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def calculate_proximity_score(self, user_lat, user_lon, hike_lat, hike_lon):
        if pd.isna(hike_lat) or pd.isna(hike_lon):
            return 0  # No score if coordinates are missing

        distance = self.haversine(user_lat, user_lon, hike_lat, hike_lon)

        if distance < 10:
            return 100  # Max score for <=10 km
        if distance < 30:
            return 70  # Medium score for <=30 km
        if distance < 50:
            return 50  # Lower score for <=50 km

        return 0  # Too far, no score

    def pre_filter_hikes(self, hikes_df):
        hikes_df = hikes_df.copy()  # Make a copy of the DataFrame to avoid modifying a view

        # Apply the min_length, max_length, min_altitude, max_altitude, and is_pet_friendly criteria
        if self.user_filters.get("min_length"):
            hikes_df = hikes_df[hikes_df["length"] >= self.user_filters["min_length"]]
        if self.user_filters.get("max_length"):
            hikes_df = hikes_df[hikes_df["length"] <= self.user_filters["max_length"]]

        # Use 'min_altitude' and 'max_altitude' columns for altitude filtering
        if self.user_filters.get("min_altitude"):
            hikes_df = hikes_df[hikes_df["min_altitude"] >= self.user_filters["min_altitude"]]
        if self.user_filters.get("max_altitude"):
            hikes_df = hikes_df[hikes_df["max_altitude"] <= self.user_filters["max_altitude"]]

        if self.user_filters.get("is_pet_friendly"):
            hikes_df = hikes_df[hikes_df["description_long"].str.contains("pet-friendly", case=False, na=False)]

        return hikes_df

    def filter_hikes_by_location(self, hikes_df):
        hikes_df = self.pre_filter_hikes(hikes_df)

        if not isinstance(self.user_filters, dict):
            raise ValueError("user_filters must be a dictionary.")

        # Step 1: Calculate Fuzzy Matching Score for Region
        if self.user_filters.get("region"):
            search_term = self.user_filters['region'].lower()

            def calculate_fuzzy_score(row):
                score = 0
                if 'primary_region' in row and pd.notna(row['primary_region']):
                    score += self.fuzzy_match(search_term, row['primary_region'])
                if 'description_short' in row and pd.notna(row['description_short']):
                    score += self.fuzzy_match(search_term, row['description_short'])
                if 'description_long' in row and pd.notna(row['description_long']):
                    score += self.fuzzy_match(search_term, row['description_long'])
                if 'title' in row and pd.notna(row['title']):
                    score += self.fuzzy_match(search_term, row['title'])
                return score

            hikes_df.loc[:, 'fuzzy_match_score'] = hikes_df.apply(calculate_fuzzy_score, axis=1)

        # Step 2: Keyword-based Description Match
        if self.user_filters.get("description_match"):
            keywords = self.user_filters["description_match"]
            hikes_df.loc[:, 'description_match_score'] = hikes_df['description_long'].apply(
                lambda x: self.keyword_match(keywords, x) if pd.notna(x) else 0
            )

        # Step 3: Calculate Proximity Score
        if self.user_filters.get("point_lat") and self.user_filters.get("point_lon"):
            hikes_df.loc[:, 'proximity_score'] = hikes_df.apply(
                lambda row: self.calculate_proximity_score(
                    self.user_filters['point_lat'], self.user_filters['point_lon'],
                    row['point_lat'], row['point_lon']
                ), axis=1
            )
        else:
            hikes_df.loc[:, 'proximity_score'] = 0

        # Step 4: Calculate Final Region Match Score
        hikes_df.loc[:, 'region_match_score'] = (
                (hikes_df['fuzzy_match_score'] * 0.7) +
                (hikes_df['proximity_score'] * 0.3)
        )

        # Step 5: Combine the description match score
        hikes_df['final_description_score'] = (
                hikes_df['description_match_score'] * 0.3  # Adjust weight as necessary
        )

        return hikes_df

