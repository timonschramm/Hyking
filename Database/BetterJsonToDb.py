import sqlite3
import json

DB_NAME = "outdooractive_data.db"

LAT_MIN = 47.2701
LAT_MAX = 50.5647
LON_MIN = 8.9767
LON_MAX = 13.839

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
            stamina_rating INTEGER,
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
            primary_region TEXT,
            season TEXT,
            primary_image_id TEXT,
            image_ids TEXT,
            publicTransportFriendly BOOLEAN
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
        stamina_rating = tour.get("ratingInfo", {}).get("stamina", None)
        season = json.dumps(tour.get("season", []))
        primary_image_id = tour.get("primaryImage", {}).get("id", None)
        image_ids = json.dumps([image.get("id") for image in tour.get("images", []) if image.get("id") != primary_image_id])
        public_transport_friendly = "publicTransportFriendly" in tour.get("labels", [])

        cursor.execute("""
            INSERT OR IGNORE INTO tours (
                id, title, teaser_text, description_short, description_long, category_name, category_id, 
                difficulty, landscape_rating, experience_rating, stamina_rating, length, ascent, descent, 
                duration_min, min_altitude, max_altitude, point_lat, point_lon, is_winter, is_closed, 
                primary_region, season, primary_image_id, image_ids, publicTransportFriendly
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tour_id, title, teaser_text, description_short, description_long, category_name, category_id,
            difficulty, landscape_rating, experience_rating, stamina_rating, length, ascent, descent,
            duration_min, min_altitude, max_altitude, point_lat, point_lon, is_winter, is_closed,
            primary_region, season, primary_image_id, image_ids, public_transport_friendly
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

def extract_images(tour):
    primary_image_id = tour.get("primaryImage", {}).get("id", None)
    image_ids = [image.get("id") for image in tour.get("images", []) if image.get("id") != primary_image_id]
    return primary_image_id, image_ids

def write_updated_json(data, jsonl=False):
    updated_data = {"tours": []}
    for tour in data["answer"]["contents"]:
        primary_image_id, image_ids = extract_images(tour)
        public_transport_friendly = "publicTransportFriendly" in tour.get("labels", [])

        tour_data = {
            "id": tour["id"],
            "title": tour.get("title", "N/A"),
            "teaser_text": tour.get("teaserText", "N/A"),
            "description_short": tour.get("texts", {}).get("short", "N/A"),
            "description_long": tour.get("texts", {}).get("long", "N/A"),
            "category_name": tour.get("category", {}).get("title", "N/A"),
            "category_id": tour.get("category", {}).get("id", "N/A"),
            "difficulty": tour.get("ratingInfo", {}).get("difficulty", None),
            "landscape_rating": tour.get("ratingInfo", {}).get("landscape", None),
            "experience_rating": tour.get("ratingInfo", {}).get("experience", None),
            "stamina_rating": tour.get("ratingInfo", {}).get("stamina", None),
            "length": tour.get("metrics", {}).get("length", None),
            "ascent": tour.get("metrics", {}).get("elevation", {}).get("ascent", None),
            "descent": tour.get("metrics", {}).get("elevation", {}).get("descent", None),
            "duration_min": tour.get("metrics", {}).get("duration", {}).get("minimal", None),
            "min_altitude": tour.get("metrics", {}).get("elevation", {}).get("minAltitude", None),
            "max_altitude": tour.get("metrics", {}).get("elevation", {}).get("maxAltitude", None),
            "point_lat": tour.get("point", [None, None])[1],
            "point_lon": tour.get("point", [None, None])[0],
            "is_winter": tour.get("isWinter", False),
            "is_closed": tour.get("isClosedByClosure", False),
            "primary_region": tour.get("primaryRegion", {}).get("title", "N/A"),
            "season": tour.get("season", []),
            "primary_image_id": primary_image_id,
            "image_ids": image_ids,
            "publicTransportFriendly": public_transport_friendly
        }
        updated_data["tours"].append(tour_data)

    if jsonl:
        with open("updated.jsonl", "w", encoding="utf-8") as file:
            for tour in updated_data["tours"]:
                file.write(json.dumps(tour, ensure_ascii=False) + "\n")
    else:
        with open("updated.json", "w", encoding="utf-8") as file:
            json.dump(updated_data, file, ensure_ascii=False, indent=4)

def filter_and_write_bavaria_json(jsonl=False):
    with open("updated.json", "r", encoding="utf-8") as file:
        data = json.load(file)

    bavaria_data = {"tours": []}
    for tour in data["tours"]:
        point_lat = tour.get("point_lat")
        point_lon = tour.get("point_lon")
        
        if point_lat is not None and point_lon is not None and LAT_MIN <= point_lat <= LAT_MAX and LON_MIN <= point_lon <= LON_MAX:
            bavaria_data["tours"].append(tour)

    if jsonl:
        with open("updatedBavaria.jsonl", "w", encoding="utf-8") as file:
            for tour in bavaria_data["tours"]:
                file.write(json.dumps(tour, ensure_ascii=False) + "\n")
    else:
        with open("updatedBavaria.json", "w", encoding="utf-8") as file:
            json.dump(bavaria_data, file, ensure_ascii=False, indent=4)

    print(f"Filtered data written to {'updatedBavaria.jsonl' if jsonl else 'updatedBavaria.json'} with {len(bavaria_data['tours'])} tours.")

# Main function to convert JSON to SQLite
def main():
    print("Loading json")
    with open("response.json", "r", encoding="utf-8") as file:
        data = json.load(file)

    # Uncomment to create or update tables
    # create_or_update_tables()
    # print("Inserting data into the database...")
    # insert_data(data)

    # Uncomment to write updated JSON
    # print("Writing updated JSON...")
    # write_updated_json(data, jsonl=False)  # Set jsonl=True to write in JSONL format

    # Uncomment to Filter and write Bavaria JSON
    print("Filtering and writing Bavaria JSON...")
    filter_and_write_bavaria_json(jsonl=False)  # Set jsonl=True to write in JSONL format

    print("Data has been successfully inserted into the database and updated JSON has been written.")

if __name__ == "__main__":
    main()
