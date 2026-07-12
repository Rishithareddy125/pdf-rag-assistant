import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function ChatHistory() {
  const { token } = useAuth()
  const [chats, setChats] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.listChats(token).then(setChats).catch(() => setChats([])),
      api.listDocuments(token).then(setDocuments).catch(() => setDocuments([])),
    ]).finally(() => setLoading(false))
  }, [token])

  return (
    <div className="p-10 bg-paper min-h-screen text-ink">
      <p className="font-mono text-xs uppercase tracking-widest text-amber font-semibold">Archive</p>
      <h1 className="mb-8 font-display text-3xl">Chat history</h1>

      {loading ? (
        <p className="text-sm text-slate font-mono">Loading…</p>
      ) : chats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/15 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate">No conversations yet.</p>
          <Link to="/chat" className="mt-3 inline-block text-sm text-amber hover:underline font-semibold">
            Start a chat
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-ink/10 bg-white overflow-hidden shadow-md">
          <ul className="divide-y divide-ink/5">
            {chats.map((c) => {
              const matchedDoc = documents.find((d) => d.id === c.document_id)
              return (
                <li key={c.id}>
                  <Link
                    to={`/chat/${c.id}`}
                    className="flex items-center justify-between px-6 py-4 text-sm hover:bg-paper transition-colors duration-200"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{c.title || 'Untitled conversation'}</p>
                        {matchedDoc && (
                          <span className="rounded bg-verified/10 border border-verified/20 px-2 py-0.5 text-[9px] font-mono text-verified tracking-tight">
                            {matchedDoc.filename}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate truncate max-w-lg">{c.preview}</p>
                    </div>
                    <span className="font-mono text-xs text-slate">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
