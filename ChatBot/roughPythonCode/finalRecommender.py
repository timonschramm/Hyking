class FinalRecommender:
    def __init__(self, user_filters, hikes_df):
        self.user_filters = user_filters
        self.hikes_df = hikes_df

    # Difficulty score calculation
    def calculate_difficulty_score(self, user_difficulty, hike_difficulty):
        if user_difficulty is None or hike_difficulty is None:
            return 0
        if user_difficulty == hike_difficulty:
            return 100
        if abs(user_difficulty - hike_difficulty) == 1:
            return 50
        return 0

    # Fitness level score calculation
    def calculate_fitness_score(self, user_fitness_level, hike_fitness_level):
        if user_fitness_level == hike_fitness_level:
            return 100
        return 0

    # Final score calculation for hikes based on all factors
    def calculate_final_score(self, row):
        location_score = row['region_match_score']
        difficulty_score = self.calculate_difficulty_score(self.user_filters.get("difficulty"), row.get("difficulty"))
        fitness_score = self.calculate_fitness_score(self.user_filters.get("fitness_level"), row.get("fitness_level"))

        final_score = (
            (location_score * 0.4) +
            (difficulty_score * 0.3) +
            (fitness_score * 0.3)
        )

        return final_score

    # Method to get final recommendations
    def get_recommendations(self):
        # Apply final score calculation
        self.hikes_df['final_score'] = self.hikes_df.apply(self.calculate_final_score, axis=1)

        # Sort by final score and return the top hikes
        self.hikes_df = self.hikes_df.sort_values(by='final_score', ascending=False)

        return self.hikes_df
