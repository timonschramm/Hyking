import sqlite3

# Geografische Grenzen von Bayern
LAT_MIN = 47.2701
LAT_MAX = 50.5647
LON_MIN = 8.9767
LON_MAX = 13.839


input_db = "outdooractive_data.db"
output_db = "filtered_data_bayern.db"

def filter_data():

    conn_in = sqlite3.connect(input_db)
    cursor_in = conn_in.cursor()


    conn_out = sqlite3.connect(output_db)
    cursor_out = conn_out.cursor()
    cursor_out.execute("""
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

    
    print("Lese Daten")
    cursor_in.execute("SELECT * FROM tours")
    rows = cursor_in.fetchall()


    cursor_in.execute("PRAGMA table_info(tours)")
    columns = [col[1] for col in cursor_in.fetchall()]
    columns_str = ", ".join(columns)
    placeholders = ", ".join("?" for _ in columns)


    print("Filtere Daten")
    filtered_rows = [
        row for row in rows
        if row[columns.index('point_lat')] is not None and
           row[columns.index('point_lon')] is not None and
           LAT_MIN <= row[columns.index('point_lat')] <= LAT_MAX and
           LON_MIN <= row[columns.index('point_lon')] <= LON_MAX
    ]


    print(f"Speichere {len(filtered_rows)}")
    cursor_out.executemany(f"""
        INSERT OR IGNORE INTO tours ({columns_str}) VALUES ({placeholders})
    """, filtered_rows)


    conn_out.commit()
    conn_out.close()
    conn_in.close()
    print("Db erstellt.")

if __name__ == "__main__":
    filter_data()
