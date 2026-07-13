"""
Generation via Google Gemini API. This is where the brief's core safety requirement
lives: the model must refuse rather than invent facts when the retrieved
context doesn't actually answer the question.

We ask Gemini for strict JSON so citations can be rendered as chips on
the frontend without any brittle regex-parsing of prose.
"""
import json
from typing import List, Optional
import requests

from app.config import settings
from app.services.vector_store import query as vector_query
from app.services.embeddings import embed_query


SYSTEM_PROMPT = """You are DocuMind, an enterprise knowledge assistant.

Hard rules, no exceptions:
1. Answer ONLY using the CONTEXT block below. Never use outside knowledge,
   even if you are confident it's correct.
2. Every factual claim must be traceable to a specific (document, page) pair
   from the context. Do not combine facts from different pages into a claim
   that no single page supports.
3. If the context does not contain enough information to answer the
   question, you MUST refuse. Do not guess, infer beyond what's written, or
   fill gaps with plausible-sounding detail.

Respond with ONLY a JSON object (no markdown fences, no preamble) matching
exactly this shape:
{
  "refused": boolean,
  "answer": string,          // the answer, or a brief explanation of why you can't answer
  "citations": [
    {"document": string, "page": number, "snippet": string}
  ]
}

If refused is true, citations must be an empty array and answer should be a
short, standardized message such as "I don't have information about this in
the ingested documents."
"""


def _build_context(matches) -> str:
    if not matches:
        return "(no relevant passages found)"
    blocks = []
    for m in matches:
        meta = m.get("metadata", {})
        text_content = meta.get("parent_text") or meta.get("text") or ""
        blocks.append(
            f"[Document: {meta.get('filename')} | Page: {meta.get('page')}]\n{text_content}"
        )
    return "\n\n---\n\n".join(blocks)


def answer_question(question: str, top_k: int = 5, document_id: Optional[str] = None) -> dict:
    query_embedding = embed_query(question)
    matches = vector_query(query_embedding, top_k=top_k, document_id=document_id)
    context = _build_context(matches)

    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"CONTEXT:\n{context}\n\nQUESTION:\n{question}"}
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {"text": SYSTEM_PROMPT}
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        res_json = response.json()
        raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raw_text = "{}"

    try:
        parsed = json.loads(raw_text)
    except (json.JSONDecodeError, TypeError):
        # Model didn't return clean JSON — fail safe into a refusal rather
        # than showing the user a broken or unverifiable answer.
        parsed = {
            "refused": True,
            "answer": "I wasn't able to verify an answer for this from the ingested documents.",
            "citations": [],
        }

    parsed.setdefault("citations", [])
    parsed.setdefault("refused", False)
    return parsed
