class FinalRecommender:
    def __init__(self, user_filters, hikes_df):
        self.user_filters = user_filters
        self.hikes_df = hikes_df

    def calculate_final_score(self, row):
        """
        Compute final score based on keyword, proximity, and difficulty scores.
        """
        keyword_score = row.get("keyword_score", 0)
        proximity_score = row.get("proximity_score", 0)
        difficulty_score = 100 if self.user_filters.get("difficulty") == row.get("difficulty") else 0

        # Weighted final score
        return (
            (keyword_score * 0.5) +
            (proximity_score * 0.3) +
            (difficulty_score * 0.2)
        )

    def get_recommendations(self, top_n=5):
        """
        Apply final scoring and return top recommendations.
        """
        self.hikes_df["final_score"] = self.hikes_df.apply(self.calculate_final_score, axis=1)
        recommendations = self.hikes_df.sort_values(by="final_score", ascending=False).head(top_n)
        return recommendations
