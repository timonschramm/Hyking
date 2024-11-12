from elasticsearch import Elasticsearch
client = Elasticsearch(
    "https://recsysprak-b2a37e.es.eu-west-1.aws.elastic.cloud:443",
    api_key="bDY1NEZaTUJNQjlCLWItTlI0N2Y6a25YRkYzT0pTSVM0ODZ0OE9SbkR2dw=="
)
client.indices.create(
    index="search-5xa3",
    mappings={
        "properties": {
            "vector": {"type": "dense_vector", "dims": 3 },
            "text": {"type": "text"}
        }
    }
)