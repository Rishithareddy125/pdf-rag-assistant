import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import CitationChip from '../components/CitationChip'

export default function ChatAssistant() {
  const { token } = useAuth()
  const { chatId } = useParams()
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [documents, setDocuments] = useState([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [activeDoc, setActiveDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const bottomRef = useRef(null)

  // Fetch all documents on mount
  useEffect(() => {
    api.listDocuments(token)
      .then((docs) => setDocuments(docs.filter(d => d.status === 'ready')))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [token])

  // Fetch chat session messages if chatId changes
  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setActiveDoc(null)
      setSelectedDocId('')
      return
    }
    
    // Skip redundant fetch if we already have messages loaded in local state
    if (messages.length > 0) {
      return
    }

    api.getChat(token, chatId)
      .then((c) => {
        setMessages(c.messages)
        if (c.document_id) {
          setSelectedDocId(c.document_id)
        }
      })
      .catch(() => {})
  }, [chatId, token])

  // Resolve active document name once documents and selectedDocId are loaded
  useEffect(() => {
    if (selectedDocId && documents.length > 0) {
      const doc = documents.find((d) => d.id === selectedDocId)
      if (doc) setActiveDoc(doc)
    }
  }, [selectedDocId, documents])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    if (!selectedDocId) return

    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setSending(true)

    try {
      const res = await api.sendChatMessage(token, chatId, text, selectedDocId)
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.answer, citations: res.citations, refused: res.refused },
      ])
      if (!chatId && res.chat_id) {
        navigate(`/chat/${res.chat_id}`, { replace: true })
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Something went wrong: ${err.message}`, error: true },
      ])
    } finally {
      setSending(false)
    }
  }

  const isNewChat = !chatId

  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      {/* Header */}
      <div className="border-b border-ink/10 bg-white/70 backdrop-blur-md px-10 py-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber font-semibold">RAG Chat Session</p>
          <h1 className="font-display text-2xl font-semibold">
            {activeDoc ? `Chatting about: ${activeDoc.filename}` : 'Select a PDF Document'}
          </h1>
        </div>
        {activeDoc && (
          <span className="rounded-full bg-verified/10 border border-verified/25 px-3 py-1 text-xs font-mono text-verified flex items-center gap-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-verified animate-ping"></span>
            Isolated Context
          </span>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto px-10 py-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/20 via-paper to-paper">
        {/* Setup Screen for New Chats */}
        {isNewChat && messages.length === 0 && (
          <div className="mx-auto max-w-lg pt-12">
            <div className="rounded-xl border border-ink/10 bg-white p-8 shadow-lg backdrop-blur-md">
              <h2 className="mb-2 font-display text-xl">Single Document Focus</h2>
              <p className="mb-6 text-sm text-slate">
                To guarantee zero cross-document hallucinations, select the document you want to query. The AI will strictly restrict search to this PDF file.
              </p>

              {loading ? (
                <p className="text-sm text-slate font-mono">Loading active documents…</p>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-rust/30 bg-rust/5 p-6 text-center">
                  <p className="text-sm text-rust mb-3">No processed documents found in your knowledge base.</p>
                  <Link
                    to="/upload"
                    className="inline-block rounded bg-ink px-4 py-2 text-xs text-paper hover:bg-ink/90 font-medium transition-all"
                  >
                    Go Upload a PDF
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate font-semibold">
                    Choose a PDF document:
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full rounded-md border border-ink/15 bg-white px-3 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="">-- Click to Select Document --</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.filename} ({d.page_count} pages)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="mx-auto flex max-w-3xl flex-col gap-6 pt-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-ink/10 bg-white/70 backdrop-blur-md px-10 py-5">
        <form onSubmit={handleSend} className="mx-auto max-w-3xl">
          <div className="flex gap-3 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!selectedDocId || sending}
              placeholder={
                !selectedDocId
                  ? 'Please select a document above first to start...'
                  : `Ask a question about ${activeDoc?.filename || 'the document'}...`
              }
              className="flex-1 rounded-md border border-ink/15 px-4 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 disabled:bg-paper/50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={!selectedDocId || sending || !input.trim()}
              className="rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {sending ? 'Thinking…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-ink px-5 py-3.5 text-sm text-paper shadow-md transition-all duration-300">
        {message.content}
      </div>
    )
  }

  return (
    <div
      className={`mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border px-5 py-4 text-sm leading-relaxed shadow-sm transition-all duration-300 ${
        message.refused
          ? 'border-rust/20 bg-rust/5 text-rust'
          : message.error
          ? 'border-rust/20 bg-rust/5 text-rust'
          : 'border-ink/10 bg-white'
      }`}
    >
      {message.refused && (
        <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-rust font-bold">
          Strict Grounding Refusal
        </p>
      )}
      <p className="whitespace-pre-wrap">{message.content}</p>
      {message.citations?.length > 0 && (
        <div className="mt-3 border-t border-ink/5 pt-2 flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate font-bold">
            Sources:
          </span>
          {message.citations.map((c, i) => (
            <CitationChip key={i} document={c.document} page={c.page} snippet={c.snippet} />
          ))}
        </div>
      )}
    </div>
  )
}
