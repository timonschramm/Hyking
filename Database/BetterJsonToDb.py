import sqlite3
import json


DB_NAME = "outdooractive_data.db"


def create_or_update_tables():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()


    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tours (
            id TEXT PRIMARY KEY,
            title TEXT,
            teaser_text TEXT,
            description_short TEXT,
            description_long TEXT,
            category_name TEXT,
            category_id TEXT,
            difficulty INTEGER,
            landscape_rating INTEGER,
            experience_rating INTEGER,
            length INTEGER,
            ascent INTEGER,
            descent INTEGER,
            duration_min FLOAT,
            min_altitude INTEGER,
            max_altitude INTEGER,
            point_lat REAL,
            point_lon REAL,
            is_winter BOOLEAN,
            is_closed BOOLEAN,
            primary_region TEXT
        )
    """)


    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tour_properties (
            tour_id TEXT,
            property_name TEXT,
            property_title TEXT,
            property_icon_url TEXT,
            PRIMARY KEY (tour_id, property_name)
        )
    """)


    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tour_regions (
            tour_id TEXT,
            region_id TEXT,
            region_type TEXT,
            PRIMARY KEY (tour_id, region_id)
        )
    """)

    conn.commit()
    conn.close()


def insert_data(data):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    for idx, tour in enumerate(data["answer"]["contents"], start=1):
        print(f"Inserting tour {idx}/{len(data['answer']['contents'])} with ID: {tour['id']}")


        tour_id = tour["id"]
        title = tour.get("title", "N/A")
        teaser_text = tour.get("teaserText", "N/A")
        description_short = tour.get("texts", {}).get("short", "N/A")
        description_long = tour.get("texts", {}).get("long", "N/A")
        category_name = tour.get("category", {}).get("title", "N/A")
        category_id = tour.get("category", {}).get("id", "N/A")
        difficulty = tour.get("ratingInfo", {}).get("difficulty", None)
        landscape_rating = tour.get("ratingInfo", {}).get("landscape", None)
        experience_rating = tour.get("ratingInfo", {}).get("experience", None)
        length = tour.get("metrics", {}).get("length", None)
        ascent = tour.get("metrics", {}).get("elevation", {}).get("ascent", None)
        descent = tour.get("metrics", {}).get("elevation", {}).get("descent", None)
        duration_min = tour.get("metrics", {}).get("duration", {}).get("minimal", None)
        min_altitude = tour.get("metrics", {}).get("elevation", {}).get("minAltitude", None)
        max_altitude = tour.get("metrics", {}).get("elevation", {}).get("maxAltitude", None)
        point_lat = tour.get("point", [None, None])[1]
        point_lon = tour.get("point", [None, None])[0]
        is_winter = tour.get("isWinter", False)
        is_closed = tour.get("isClosedByClosure", False)
        primary_region = tour.get("primaryRegion", {}).get("title", "N/A")


        cursor.execute("""
            INSERT OR IGNORE INTO tours (
                id, title, teaser_text, description_short, description_long, category_name, category_id, 
                difficulty, landscape_rating, experience_rating, length, ascent, descent, duration_min,
                min_altitude, max_altitude, point_lat, point_lon, is_winter, is_closed, primary_region
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tour_id, title, teaser_text, description_short, description_long, category_name, category_id,
            difficulty, landscape_rating, experience_rating, length, ascent, descent, duration_min,
            min_altitude, max_altitude, point_lat, point_lon, is_winter, is_closed, primary_region
        ))


        for prop in tour.get("properties", []):
            property_name = prop.get("name", "N/A")
            property_title = prop.get("title", "N/A")
            property_icon_url = prop.get("iconUrl", None)
            cursor.execute("""
                INSERT OR IGNORE INTO tour_properties (
                    tour_id, property_name, property_title, property_icon_url
                ) VALUES (?, ?, ?, ?)
            """, (
                tour_id, property_name, property_title, property_icon_url
            ))


        for region in tour.get("regions", []):
            region_id = region.get("id", "N/A")
            region_type = region.get("type", "N/A")
            cursor.execute("""
                INSERT OR IGNORE INTO tour_regions (
                    tour_id, region_id, region_type
                ) VALUES (?, ?, ?)
            """, (
                tour_id, region_id, region_type
            ))

    conn.commit()
    conn.close()
    print(f"Successfully inserted {len(data['answer']['contents'])} tours into the database.")

# Main function to convert JSON to SQLite
def main():
    print("Loading json")
    with open("response.json", "r", encoding="utf-8") as file:
        data = json.load(file)


    create_or_update_tables()

    print("Inserting data into the database...")
    insert_data(data)

    print("Data has been successfully inserted into the database.")

if __name__ == "__main__":
    main()
