import sqlite3
import pandas as pd

def fetch_hike_data():
    conn = sqlite3.connect("filtered_data_bayern_translated.db")
    query = "SELECT * FROM tours"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def fetch_user_interactions():
    conn = sqlite3.connect("filtered_data_bayern_translated.db")
    query = "SELECT user_id, hike_id, rating FROM user_interactions"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df
