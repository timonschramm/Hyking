class FinalRecommender:
    def __init__(self, user_filters, hikes_df):
        """
        Initialize with user filters and hike data.
        """
        self.user_filters = user_filters
        self.hikes_df = hikes_df

    def calculate_difficulty_score(self, user_difficulty, hike_difficulty):
        """
        Calculate a score for difficulty level matching.
        """
        if user_difficulty is None or hike_difficulty is None:
            return 0
        if user_difficulty == hike_difficulty:
            return 100
        elif abs(user_difficulty - hike_difficulty) == 1:
            return 50
        return 0

    def calculate_fitness_score(self, user_fitness_level, hike_fitness_level):
        """
        Calculate a score for fitness level matching.
        """
        if user_fitness_level is None or hike_fitness_level is None:
            return 0
        return 100 if user_fitness_level == hike_fitness_level else 0

    def calculate_final_score(self, row):
        """
        Calculate the final score for a hike based on multiple factors.
        """
        location_score = row.get('region_match_score', 0)
        difficulty_score = self.calculate_difficulty_score(
            self.user_filters.get("difficulty"),
            row.get("difficulty")
        )
        fitness_score = self.calculate_fitness_score(
            self.user_filters.get("fitness_level"),
            row.get("fitness_level")
        )

        # Final weighted score calculation
        return (
            (location_score * 0.5) +  # Location is weighted higher
            (difficulty_score * 0.3) +
            (fitness_score * 0.2)
        )

    def get_recommendations(self, top_n=5):
        """
        Apply the scoring function to each hike and return the top recommendations.
        """
        # Ensure region match scores are calculated
        if "region_match_score" not in self.hikes_df.columns:
            self.hikes_df["region_match_score"] = 0

        # Calculate the final score for each hike
        self.hikes_df["final_score"] = self.hikes_df.apply(self.calculate_final_score, axis=1)

        # Sort hikes by final score in descending order
        top_hikes = self.hikes_df.sort_values(by="final_score", ascending=False).head(top_n)

        # Return the top hikes DataFrame
        return top_hikes
