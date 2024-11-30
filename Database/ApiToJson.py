import requests
import json


API_BASE_URL = "https://api-oa.com/api/v2/project/api-dev-oa/"
API_KEY = "yourtest-outdoora-ctiveapi"


def fetch_ids():
    endpoint = "contents"
    params = {
        "key": API_KEY,
        "format": "json",
        "type": "tour",
        "typeFields": "id",
        "count": 100000,
        "startIndex": 0
    }

    all_ids = []
    while True:
        print(f"Fetching IDs starting at index {params['startIndex']}...")
        url = f"{API_BASE_URL}{endpoint}"
        response = requests.get(url, params=params)

        if response.status_code != 200:
            print(f"Failed to fetch IDs: {response.status_code}, {response.text}")
            break

        data = response.json()
        if "answer" in data and "contents" in data["answer"]:
            ids = [item["id"] for item in data["answer"]["contents"]]
            all_ids.extend(ids)

            if len(ids) < params["count"]:  # No more IDs to fetch
                break
            params["startIndex"] += params["count"]  # Increment pagination index
        else:
            print("No more data or an error occurred.")
            break

    return all_ids

def fetch_verbose_details(ids):
    endpoint = f"contents/{','.join(ids)}"
    params = {
        "key": API_KEY,
        "format": "json",
        "display": "verbose",
        "lang": "en"
    }
    url = f"{API_BASE_URL}{endpoint}"
    response = requests.get(url, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch details: {response.status_code}, {response.text}")
        return None

def main():
    all_ids = fetch_ids()
    print(f"Total IDs fetched: {len(all_ids)}")

    all_data = {"answer": {"contents": []}}

    batch_size = 50
    for i in range(0, len(all_ids), batch_size):
        batch_ids = all_ids[i:i + batch_size]
        print(f"Fetching details for IDs: {batch_ids}")
        data = fetch_verbose_details(batch_ids)
        if data and "answer" in data and "contents" in data["answer"]:
            all_data["answer"]["contents"].extend(data["answer"]["contents"])

    # Save the combined data to a JSON file
    with open("response.json", "w", encoding="utf-8") as file:
        json.dump(all_data, file, ensure_ascii=False, indent=4)
    print("All data has been saved to response.json")

if __name__ == "__main__":
    main()
