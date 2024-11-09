import requests
import json


def download_public_data():
   ids_url = "https://api-oa.com/api/v2/project/api-dev-oa/contents?type=tour&key=yourtest-outdoora-ctiveapi&count=10000&startIndex=0"
   base_url = "https://api-oa.com/api/v2/project/api-dev-oa/contents/"
   
   response = requests.get(ids_url).json()
   ids = response["answer"]["contents"]
   
   dataset = {} 
   for entry in ids:
     id = entry["id"]
     url = base_url + id + "?display=snippet&lang=de&key=yourtest-outdoora-ctiveapi"
     response = requests.get(url).json()
     if response["header"]["status"] == "ok":
        dataset[id] = response["answer"]["contents"]
   with open("dataset_public_api.json", "w") as outfile:
     json.dump(dataset, outfile)

download_public_data()

