"""
Thin wrapper around Pinecone so routers never touch the SDK directly.

Each vector's metadata carries {document_id, filename, page, text} so a
retrieval hit can be turned straight into a citation chip on the frontend
without a second database lookup.
"""
from typing import List, Optional

from pinecone import Pinecone, ServerlessSpec

from app.config import settings

EMBEDDING_DIMENSION = 384

_pc: Optional[Pinecone] = None


def _client() -> Pinecone:
    global _pc
    if not settings.pinecone_api_key:
        raise RuntimeError("PINECONE_API_KEY is not set. Add it to your .env file.")
    if _pc is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


def ensure_index():
    pc = _client()
    existing = [idx["name"] for idx in pc.list_indexes()]
    if settings.pinecone_index_name not in existing:
        pc.create_index(
            name=settings.pinecone_index_name,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud=settings.pinecone_cloud, region=settings.pinecone_region),
        )


def get_index():
    ensure_index()
    return _client().Index(settings.pinecone_index_name)


def upsert_chunks(document_id: str, filename: str, chunks, embeddings: List[List[float]]):
    """chunks: List[pdf_processing.Chunk] aligned 1:1 with embeddings."""
    index = get_index()
    vectors = [
        {
            "id": f"{document_id}-{i}",
            "values": emb,
            "metadata": {
                "document_id": document_id,
                "filename": filename,
                "page": chunk.page,
                "text": chunk.text,
                "parent_text": chunk.parent_text,
            },
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    # Pinecone recommends batches of ~100 vectors per upsert call.
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i : i + 100])


def query(embedding: List[float], top_k: int = 5, document_id: Optional[str] = None):
    index = get_index()
    if document_id:
        result = index.query(vector=embedding, filter={"document_id": document_id}, top_k=top_k, include_metadata=True)
    else:
        result = index.query(vector=embedding, top_k=top_k, include_metadata=True)
    return result.get("matches", [])


def delete_document(document_id: str):
    index = get_index()
    index.delete(filter={"document_id": {"$eq": document_id}})
