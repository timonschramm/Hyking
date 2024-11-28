import json
import sqlite3

def condense_and_import_to_db(input_file, db_file):

    # Load JSON data
    print("Loading JSON data...")
    with open(input_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    # Connect to SQLite3 database
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Create the hikes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hikes (
            hike_id TEXT PRIMARY KEY,
            title TEXT,
            category TEXT,
            short_description TEXT,
            long_description TEXT,
            safety_guidelines TEXT,
            tips TEXT,
            region_id TEXT,
            region_type TEXT,
            region_name TEXT,
            starting_point TEXT,
            destination TEXT,
            geojson TEXT,
            distance REAL
        );
    """)

    # Prepare for insertion
    successful_inserts = 0
    failed_inserts = 0

    # Helper function to get clean value
    def get_value(value, default=None):
        return value.strip() if isinstance(value, str) and value.strip() else value or default

    # Process each hike entry
    print("Processing data...")
    for hikes in data.values():
        for hike in hikes:
            try:
                hike_id = hike.get("id")
                title = get_value(hike.get("title"))
                category = get_value(hike.get("category", {}).get("title"))
                short_description = get_value(hike.get("texts", {}).get("short"))
                long_description = get_value(hike.get("texts", {}).get("long"))
                safety_guidelines = get_value(hike.get("texts", {}).get("safetyGuidelines"))
                tips = get_value(hike.get("texts", {}).get("tip"))
                region_id = get_value(hike.get("primaryRegion", {}).get("id"))
                region_type = get_value(hike.get("primaryRegion", {}).get("type"))
                region_name = get_value(hike.get("primaryRegion", {}).get("name"))
                starting_point = get_value(hike.get("texts", {}).get("startingPoint"))
                destination = get_value(hike.get("texts", {}).get("destination"))

                # Ensure GeoJSON is fully serialized as a single text field
                geojson = json.dumps(hike.get("geoJson", {}), ensure_ascii=False)

                # Handle distance (ensure it's float or None)
                distance = hike.get("distance", None)
                if distance is not None:
                    distance = float(distance)

                # Insert into database
                cursor.execute("""
                    INSERT INTO hikes (
                        hike_id, title, category, short_description, long_description,
                        safety_guidelines, tips, region_id, region_type, region_name,
                        starting_point, destination, geojson, distance
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    hike_id, title, category, short_description, long_description,
                    safety_guidelines, tips, region_id, region_type, region_name,
                    starting_point, destination, geojson, distance
                ))
                successful_inserts += 1

            except Exception as e:
                print(f"Failed to insert hike ID {hike.get('id')}: {e}")
                failed_inserts += 1

    # Commit and close the database connection
    conn.commit()
    conn.close()

    print(f"Import completed: {successful_inserts} rows inserted, {failed_inserts} rows failed.")


# Paths to your JSON file and database



# Define paths
input_path = ""
db_path = ""

# Run the function
condense_and_import_to_db(input_path, db_path)
