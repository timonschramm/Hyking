import requests
import json
from tqdm import tqdm

def download_public_data(limit=None):
    ids_url = "https://api-oa.com/api/v2/project/api-dev-oa/contents?type=tour&key=yourtest-outdoora-ctiveapi&count=10000&startIndex=0"
    base_url = "https://api-oa.com/api/v2/project/api-dev-oa/contents/"
    
    print("Fetching list of IDs...")
    try:
        response = requests.get(ids_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching IDs: {e}")
        return
    except json.JSONDecodeError:
        print("Error decoding JSON response for IDs.")
        return
    
    ids = data.get("answer", {}).get("contents", [])
    if not ids:
        print("No IDs found in the response.")
        return
    
    if limit is not None:
        ids = ids[:limit]
    
    total_size = 0  # To track total data size in MB
    dataset = {}
    
    print(f"Starting download of {len(ids)} entries:")
    for entry in tqdm(ids, desc="Downloading entries", unit="entry"):
        id = entry.get("id")
        if not id:
            print("Entry without 'id' found. Skipping.")
            continue
        
        url = f"{base_url}{id}?display=verbose&lang=de&key=yourtest-outdoora-ctiveapi"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for ID {id}: {e}")
            continue
        except json.JSONDecodeError:
            print(f"Error decoding JSON response for ID {id}.")
            continue
        
        header = data.get("header", {})
        if header.get("status") != "ok":
            print(f"Status not ok for ID {id}. Skipping.")
            continue
        
        contents = data.get("answer", {}).get("contents")
        if not contents:
            print(f"No 'contents' found for ID {id}. Skipping.")
            continue
        
        dataset[id] = contents
        
        # Estimate size in MB
        size_mb = len(json.dumps(contents).encode('utf-8')) / (1024 * 1024)
        total_size += size_mb
        
        # Update progress bar description with total size
        tqdm.write(f"Total downloaded: {total_size:.2f} MB")
    
    if dataset:
        try:
            with open("dataset_public_api.json", "w") as outfile:
                json.dump(dataset, outfile)
            print(f"\nDownload completed: {len(dataset)} entries downloaded.")
            print(f"Total data size: {total_size:.2f} MB")
        except IOError as e:
            print(f"Error writing to file: {e}")
    else:
        print("No data downloaded.")

# Example usage: download only 10 entries
if __name__ == "__main__":
    download_public_data()

