from typing import List
import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Load embedding model once with offline fallback
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    logger.warning(
        f"Failed to load sentence-transformer 'all-MiniLM-L6-v2' online: {e}. "
        "Attempting to load from local cache with local_files_only=True..."
    )
    model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)


def embed_documents(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for document chunks.
    Returns a list of 384-dimensional vectors.
    """
    return model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    ).tolist()


def embed_query(text: str) -> List[float]:
    """
    Generate embedding for a search query.
    Returns a single 384-dimensional vector.
    """
    return model.encode(
        [text],
        convert_to_numpy=True,
        normalize_embeddings=True
    )[0].tolist()