import logging
import requests
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)


def get_embedding(text: str) -> List[float]:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.gemini_api_key}"
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        },
        "outputDimensionality": 384
    }

    response = requests.post(url, json=payload, timeout=15)
    response.raise_for_status()
    data = response.json()
    return data["embedding"]["values"]


def embed_documents(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for document chunks using the Gemini API.
    Returns a list of 384-dimensional vectors.
    """
    if not texts:
        return []

    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key={settings.gemini_api_key}"

    # Batch requests in chunks of 50 to avoid payload size limit
    batch_size = 50
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        chunk_texts = texts[i:i + batch_size]
        payload = {
            "requests": [
                {
                    "model": "models/text-embedding-004",
                    "content": {
                        "parts": [{"text": t}]
                    },
                    "outputDimensionality": 384
                }
                for t in chunk_texts
            ]
        }

        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()

        embeddings_list = [emb["values"] for emb in data["embeddings"]]
        all_embeddings.extend(embeddings_list)

    return all_embeddings


def embed_query(text: str) -> List[float]:
    """
    Generate embedding for a search query.
    Returns a single 384-dimensional vector.
    """
    return get_embedding(text)