import logging
import requests
import time
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)


def post_with_retry(url: str, json: dict, timeout: int, max_retries: int = 5) -> requests.Response:
    for attempt in range(max_retries):
        response = requests.post(url, json=json, timeout=timeout)
        if response.status_code == 429:
            retry_delay_seconds = 15.0  # Safe default delay for rate limits
            try:
                error_details = response.json()
                # Parse retryDelay from Google's response if available
                details = error_details.get("error", {}).get("details", [])
                for d in details:
                    if d.get("@type") == "type.googleapis.com/google.rpc.RetryInfo":
                        delay_str = d.get("retryDelay", "")  # e.g., '45s'
                        if delay_str.endswith("s"):
                            try:
                                retry_delay_seconds = float(delay_str[:-1]) + 1.0  # Add 1s safety margin
                            except ValueError:
                                pass
            except Exception:
                error_details = response.text

            logger.warning(
                f"Gemini API rate limit hit (429). Details: {error_details}. "
                f"Retrying in {retry_delay_seconds} seconds (attempt {attempt + 1}/{max_retries})..."
            )
            time.sleep(retry_delay_seconds)
            continue
        return response
    # Return the last response to let it raise_for_status
    return response


def get_embedding(text: str) -> List[float]:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={settings.gemini_api_key}"
    payload = {
        "model": "models/gemini-embedding-2",
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key={settings.gemini_api_key}"

    # Batch requests in chunks of 30 to stay under the 100 RPM free tier limit
    # (Each sub-request inside batchEmbedContents counts as 1 request towards the limit)
    batch_size = 30
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        if i > 0:
            time.sleep(15.0)  # Proactive 15-second delay between batches to respect rate limits
        chunk_texts = texts[i:i + batch_size]
        payload = {
            "requests": [
                {
                    "model": "models/gemini-embedding-2",
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