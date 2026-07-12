"""
Page-aware PDF ingestion.

We deliberately chunk *within* page boundaries (never merging text across
pages) so every chunk can carry a single, unambiguous page number — that's
what makes the citation feature ("Refund Policy, p.12") trustworthy instead
of approximate.
"""
from dataclasses import dataclass
from typing import List

from pypdf import PdfReader

CHUNK_SIZE = 300  # child chunk size (characters)
CHUNK_OVERLAP = 50


@dataclass
class Chunk:
    text: str
    parent_text: str
    page: int  # 1-indexed


def extract_pages(file_path: str) -> List[str]:
    reader = PdfReader(file_path)
    return [page.extract_text() or "" for page in reader.pages]


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Simple recursive-ish splitter: break on paragraph, then sentence, then hard cut."""
    text = text.strip()
    if len(text) <= chunk_size:
        return [text] if text else []

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end < len(text):
            # try to break at the last paragraph/sentence boundary before `end`
            boundary = max(text.rfind("\n\n", start, end), text.rfind(". ", start, end))
            if boundary > start:
                end = boundary + 1
        chunks.append(text[start:end].strip())
        start = max(end - overlap, end) if end - overlap <= start else end - overlap
    return [c for c in chunks if c]


def process_pdf(file_path: str) -> List[Chunk]:
    """Returns page-tagged chunks ready for embedding."""
    pages = extract_pages(file_path)
    chunks: List[Chunk] = []
    for page_num, page_text in enumerate(pages, start=1):
        for piece in chunk_text(page_text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
            chunks.append(Chunk(text=piece, parent_text=page_text, page=page_num))
    return chunks


def page_count(file_path: str) -> int:
    return len(PdfReader(file_path).pages)
