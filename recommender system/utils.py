from transformers import PreTrainedModel, PreTrainedTokenizer
from sentence_transformers import SentenceTransformer
import torch

def get_text_embedding(text:str, model, tokenizer, avg:bool):
    """
    Calculate an embedding for the given text using the specified model

    Parameters:
    - text: The text for which the embedding will be calculated
    - model: The language model used for the embedding
    - tokenizer: The according tokenizer for the model
    - avg: If the cls embedding is used or if the embeddings are averaged

    Returns:
    - numpy Array: The numpy array of the embedding for the given text
    """
    if isinstance(model, SentenceTransformer):
        return torch.tensor(model.encode(text, convert_to_tensor=True)).numpy()
    elif isinstance(model, PreTrainedModel) and isinstance(tokenizer, PreTrainedTokenizer):
        input = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

        with torch.no_grad():
            output = model(**input)

        if avg:
            embedding = output.last_hidden_state.mean(dim=1)
        else:
            embedding = output.last_hidden_state[:, 0, :]
        
        return embedding.numpy()
    else:
        ValueError("Model or Tokenizer invalidlse:VaModel or Tokenizer invalid")