class FinalRecommender:
    def __init__(self, user_filters, hikes_df):
        """
        Initialize with user filters and hike data.
        """
        self.user_filters = user_filters
        self.hikes_df = hikes_df

    def calculate_final_score(self, row):
        """
        Compute the final score based on multiple filters.
        """
        # Scores for different filters
        keyword_score = row.get("keyword_score", 0)
        proximity_score = row.get("proximity_score", 0)
        difficulty_score = 0
        length_score = 0
        altitude_score = 0

        # Difficulty score
        if self.user_filters.get("difficulty") is not None:
            difficulty_score = (
                100 if self.user_filters.get("difficulty") == row.get("difficulty") else 0
            )

        # Length score (make-or-break criteria)
        if self.user_filters.get("min_length") or self.user_filters.get("max_length"):
            hike_length = row.get("length", 0)
            min_length = self.user_filters.get("min_length", 0)
            max_length = self.user_filters.get("max_length", float('inf'))
            length_score = 100 if min_length <= hike_length <= max_length else 0

        # Altitude score
        if self.user_filters.get("min_altitude") or self.user_filters.get("max_altitude"):
            hike_min_alt = row.get("minAltitude", 0)
            hike_max_alt = row.get("maxAltitude", 0)
            user_min_alt = self.user_filters.get("min_altitude", 0)
            user_max_alt = self.user_filters.get("max_altitude", float('inf'))

            # Check if hike altitude falls within user altitude range
            altitude_score = 100 if (
                hike_min_alt >= user_min_alt and hike_max_alt <= user_max_alt
            ) else 0

        # Weighted final score
        return (
            (keyword_score * 0.4) +  # High weight for keyword matches
            (proximity_score * 0.3) +  # Proximity is important
            (difficulty_score * 0.2) +  # Moderate weight for difficulty
            (length_score * 0.3) +  # Significant weight for length criteria
            (altitude_score * 0.2)  # Moderate weight for altitude criteria
        )

    def get_recommendations(self, top_n=5):
        """
        Apply the scoring function and return top recommendations.
        """
        # Ensure all score columns exist
        if "keyword_score" not in self.hikes_df.columns:
            self.hikes_df["keyword_score"] = 0
        if "proximity_score" not in self.hikes_df.columns:
            self.hikes_df["proximity_score"] = 0

        # Calculate final scores for each hike
        self.hikes_df["final_score"] = self.hikes_df.apply(self.calculate_final_score, axis=1)

        # Sort hikes by final score in descending order
        recommendations = self.hikes_df.sort_values(by="final_score", ascending=False).head(top_n)
        return recommendations
