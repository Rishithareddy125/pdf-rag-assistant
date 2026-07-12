# DocuMind Enterprise — Backend

FastAPI backend for the RAG-based SOP Assistant. Tested and confirmed working
end-to-end (auth, JWT, protected routes, admin stats) in this environment.

## Stack

- **FastAPI** + **SQLAlchemy** (SQLite by default, swap `DATABASE_URL` for Postgres)
- **Claude (Anthropic API)** instead of OpenAI for generation
- **Voyage AI** instead of OpenAI for embeddings
- **Pinecone** for the vector index

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# fill in ANTHROPIC_API_KEY, VOYAGE_API_KEY, PINECONE_API_KEY

uvicorn app.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs`. Run the frontend's `npm run dev` alongside
it — the Vite proxy forwards `/api/*` to port 8000 automatically.

### Postgres instead of SQLite

Set `DATABASE_URL=postgresql://user:password@host:5432/documind` in `.env`.
Tables are created automatically on startup via `Base.metadata.create_all`.

## Auth model

- First person to sign up becomes `admin` automatically (bootstraps the org).
- Everyone after that signs up as `member`.
- Bearer JWT, 24h expiry by default (`ACCESS_TOKEN_EXPIRE_MINUTES`).

## The RAG pipeline (Weeks 1–2 of your plan)

1. **Upload** (`POST /api/documents/upload`) — PDF saved to disk, parsed with
   `pypdf` **page by page** (never merging text across pages, so every chunk
   keeps an unambiguous page number for citation).
2. **Chunk** — `app/services/pdf_processing.py`, ~1000 chars with 150 overlap,
   breaking on paragraph/sentence boundaries where possible.
3. **Embed** — `app/services/embeddings.py` calls Voyage AI (`voyage-3`,
   1024-dim). Swap this one file to change embedding providers.
4. **Index** — `app/services/vector_store.py` upserts to Pinecone with
   metadata `{document_id, filename, page, text}` so a retrieval hit becomes
   a citation chip with zero extra lookups.
5. **Retrieve + Generate** — `app/services/llm.py`: embeds the question,
   pulls top-k chunks from Pinecone, and sends them to Claude with a system
   prompt that **hard-requires** citations and refusal when the context
   doesn't support an answer. Claude responds in strict JSON
   (`{refused, answer, citations}`) so the frontend can render citation chips
   without parsing prose. If Claude's output isn't valid JSON, the code
   fails safe into a refusal rather than showing an unverifiable answer.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | — | first user becomes admin |
| POST | `/api/auth/login` | — | |
| GET | `/api/users/me` | ✓ | |
| GET | `/api/documents` | ✓ | |
| POST | `/api/documents/upload` | ✓ | multipart, PDF only |
| DELETE | `/api/documents/{id}` | ✓ | also purges Pinecone vectors |
| POST | `/api/chat/{chat_id}/message` | ✓ | `chat_id="new"` starts a chat |
| GET | `/api/chats` | ✓ | |
| GET | `/api/chats/{id}` | ✓ | |
| GET | `/api/admin/users` | admin | |
| GET | `/api/admin/stats` | admin | includes refusal rate |

## What's stubbed / next steps

- **Rate limiting / abuse protection** — not implemented yet.
- **Streaming responses** — chat currently returns the full answer in one
  response; swap to Claude's streaming API + SSE if you want token-by-token.
- **Background ingestion** — uploads process synchronously in the request.
  Fine for demo PDFs; move to a background task/queue (e.g. Celery, or
  FastAPI `BackgroundTasks`) before large files or high upload volume.
- **Password reset / email verification** — not built.
