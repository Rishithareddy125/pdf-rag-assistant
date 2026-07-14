import logging
import requests
import time
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)


def post_with_retry(url: str, json: dict, timeout: int, max_retries: int = 5) -> requests.Response:
    delay = 1.0
    for attempt in range(max_retries):
        response = requests.post(url, json=json, timeout=timeout)
        if response.status_code == 429:
            logger.warning(
                f"Gemini API rate limit hit (429). Retrying in {delay} seconds (attempt {attempt + 1}/{max_retries})..."
            )
            time.sleep(delay)
            delay *= 2  # Exponential backoff
            continue
        return response
    # Return the last response to let it raise_for_status
    return response


def get_embedding(text: str) -> List[float]:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={settings.gemini_api_key}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{"text": text}]
        },
        "outputDimensionality": 384
    }

    response = post_with_retry(url, json=payload, timeout=15)
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key={settings.gemini_api_key}"

    # Batch requests in chunks of 50 to avoid payload size limit
    batch_size = 50
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        chunk_texts = texts[i:i + batch_size]
        payload = {
            "requests": [
                {
                    "model": "models/gemini-embedding-001",
                    "content": {
                        "parts": [{"text": t}]
                    },
                    "outputDimensionality": 384
                }
                for t in chunk_texts
            ]
        }

        response = post_with_retry(url, json=payload, timeout=30)
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