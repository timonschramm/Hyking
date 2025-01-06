
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

    # Get all available columns in the DataFrame
    available_columns = hikes_df.columns.tolist()

    # Limit rows for better readability (display top 5 rows)
    hikes_preview = hikes_df[available_columns].head(5)

    # Display the results using tabulate
    print("\n🏞️ **Top Recommended Hikes:**")
    print(tabulate(
        hikes_preview,
        headers='keys',
        tablefmt='grid',
        showindex=False
    ))

hikes_df = db.fetch_hike_data()
print(hikes_df.columns)



def getHike(user_filters):
    location_scoring = LocationScoring(user_filters)
    # Filter hikes based on location scoring
    hikes_with_location_scores = location_scoring.filter_hikes_by_location(hikes_df)

    # Create FinalRecommender object
    final_recommender = FinalRecommender(user_filters, hikes_with_location_scores)
    # Get the final recommendations based on all factors
    final_recommended_hikes = final_recommender.get_recommendations()

    # Display the recommended hikes
    print_filtered_hikes(final_recommended_hikes)

