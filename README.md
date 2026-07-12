# DocuMind Enterprise — Frontend

React + Vite + Tailwind frontend for the RAG-based SOP Assistant.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. API calls to `/api/*` are proxied to
`http://localhost:8000` (the FastAPI backend, built next) — see `vite.config.js`.

## Structure

```
src/
  api/client.js          all backend calls in one place
  context/AuthContext.jsx token + user state, login/signup/logout
  components/
    Sidebar.jsx           app nav shell
    CitationChip.jsx       expandable [Document, p.N] citation — the product's core trust signal
    ProtectedRoute.jsx     route guard (+ adminOnly variant)
  pages/
    Login.jsx / Signup.jsx
    Dashboard.jsx           knowledge base overview
    UploadDocuments.jsx     drag-and-drop PDF ingestion
    ChatAssistant.jsx       the RAG chat — renders citations and refusal states
    ChatHistory.jsx
    Profile.jsx
    AdminPanel.jsx          user list + org stats (admin role only)
```

## Backend contract expected

`src/api/client.js` expects these FastAPI endpoints (built in the next step):

- `POST /api/auth/login`, `POST /api/auth/signup` → `{ access_token, user }`
- `GET /api/users/me`
- `GET /api/documents`, `POST /api/documents/upload` (multipart), `DELETE /api/documents/:id`
- `POST /api/chat/:chatId/message` (chatId can be `new`) → `{ answer, citations, refused, chat_id }`
- `GET /api/chats`, `GET /api/chats/:id`
- `GET /api/admin/users`, `GET /api/admin/stats` (admin only)

## Notes

- Since OpenAI isn't reachable in your environment, the backend will use Claude
  (Anthropic API) for generation and Voyage AI for embeddings instead — this frontend
  doesn't care which model powers the backend, so no changes needed here when that's wired up.
- Auth token is stored in `localStorage` for simplicity. Swap for httpOnly cookies
  before shipping to production.
