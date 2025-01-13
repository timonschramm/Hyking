import db
from finalRecommender import FinalRecommender
from locationScoring import LocationScoring
from tabulate import tabulate

def print_filtered_hikes(hikes_df):
    """
    Nicely print filtered hikes using tabulate.
    Displays all available columns from the DataFrame.
    """
    if hikes_df.empty:
        print("No hikes found matching the criteria.")
        return

    # Display top 5 hikes with all columns
    hikes_preview = hikes_df.head(5)
    print("\n🏞️ **Top Recommended Hikes:**")
    print(tabulate(
        hikes_preview,
        headers='keys',
        tablefmt='grid',
        showindex=False
    ))


# Load hike data from the database
try:
    hikes_df = db.fetch_hike_data()
    print("✅ Hike data loaded successfully!")
except Exception as e:
    print(f"❌ Error loading hike data: {e}")
    hikes_df = None


def getHike(user_filters):
    print("🛠️ User filters received:", user_filters)
    location_scoring = LocationScoring(user_filters)

    # Filter hikes based on location scoring
    hikes_with_location_scores = location_scoring.filter_hikes_by_location(hikes_df)

    # Create FinalRecommender object
    final_recommender = FinalRecommender(user_filters, hikes_with_location_scores)

    # Get the final recommendations based on all factors
    final_recommended_hikes = final_recommender.get_recommendations()

    # Display the recommended hikes
    print("Columns in final_recommended_hikes:", final_recommended_hikes.columns)

    return final_recommended_hikes

