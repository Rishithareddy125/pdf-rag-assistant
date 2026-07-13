import { useCallback, useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import CitationChip from '../components/CitationChip'

export default function Dashboard() {
  const { user, token } = useAuth()
  
  // Dashboard states
  const [docs, setDocs] = useState([])
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Active Chat states
  const [activeDocId, setActiveDocId] = useState('')
  const [activeDoc, setActiveDoc] = useState(null)
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatBottomRef = useRef(null)

  // Fetch documents and chats
  const refreshData = useCallback(() => {
    Promise.all([
      api.listDocuments(token).then(setDocs).catch(() => setDocs([])),
      api.listChats(token).then(setChats).catch(() => setChats([])),
    ]).finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Poll for document status updates if any document is processing
  useEffect(() => {
    const hasProcessing = docs.some((d) => d.status === 'processing')
    if (hasProcessing) {
      const interval = setInterval(refreshData, 4000)
      return () => clearInterval(interval)
    }
  }, [docs, refreshData])

  // Auto-scroll chat window
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle document selection for active chat panel
  const selectDocumentForChat = async (doc) => {
    if (doc.status !== 'ready') return
    setActiveDocId(doc.id)
    setActiveDoc(doc)
    setMessages([])
    setChatInput('')
    setError('')
    setSuccessMessage('')

    // Look for an existing chat session for this document
    const existingChat = chats.find((c) => c.document_id === doc.id)
    if (existingChat) {
      setChatId(existingChat.id)
      try {
        const fullChat = await api.getChat(token, existingChat.id)
        setMessages(fullChat.messages)
      } catch (err) {
        setMessages([])
      }
    } else {
      setChatId(null)
    }
  }

  // Handle direct file uploads from the dashboard
  async function handleFileUpload(files) {
    setError('')
    setSuccessMessage('')
    const file = files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const newDoc = await api.uploadDocument(token, formData)
      setSuccessMessage(`"${file.name}" uploaded successfully! It is now processing.`)
      refreshData()
    } catch (err) {
      setError(err.message || 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  // Handle sending a message in the active chat pane
  async function handleSendChatMessage(e) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || sending || !activeDocId) return

    setMessages((m) => [...m, { role: 'user', content: text }])
    setChatInput('')
    setSending(true)

    try {
      const res = await api.sendChatMessage(token, chatId, text, activeDocId)
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.answer, citations: res.citations, refused: res.refused },
      ])
      if (!chatId && res.chat_id) {
        setChatId(res.chat_id)
        api.listChats(token).then(setChats).catch(() => {})
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Error: ${err.message}`, error: true },
      ])
    } finally {
      setSending(false)
    }
  }

  const readyDocs = docs.filter((d) => d.status === 'ready')
  const totalPages = readyDocs.reduce((acc, d) => acc + d.page_count, 0)
  const processingDocs = docs.filter((d) => d.status === 'processing').length

  return (
    <div className="flex h-screen w-full bg-paper text-ink overflow-hidden">
      {/* LEFT COLUMN: Main Dashboard */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-10">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-amber font-bold">Overview</p>
          <h1 className="font-display text-4xl font-semibold mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-3 gap-6">
          <StatCard
            label="Documents Ingested"
            value={loading ? '—' : readyDocs.length}
            subtitle={processingDocs > 0 ? `${processingDocs} file(s) processing...` : 'All files ready'}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Total Pages Indexed"
            value={loading ? '—' : totalPages}
            subtitle="Page contexts chunked"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
          <StatCard
            label="Conversations"
            value={loading ? '—' : chats.length}
            subtitle="Active chat assistant sessions"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-verified/20 bg-verified/5 px-4 py-3.5 text-sm text-verified font-semibold shadow-sm animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rust/20 bg-rust/5 px-4 py-3.5 text-sm text-rust font-semibold shadow-sm animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Recent Documents Table Card */}
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm mb-8 flex-1 flex flex-col min-h-[300px]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Recent documents</h2>
            <span className="text-[11px] font-mono text-slate font-bold uppercase tracking-widest bg-paper px-2.5 py-1 rounded">
              Click a file to chat
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate font-mono">Loading documents…</p>
          ) : docs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/15 p-12 text-center my-auto">
              <p className="text-sm text-slate mb-4">No documents yet. Drag & drop a PDF below to start.</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 max-h-[300px] border-b border-ink/5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/5 pb-3 text-xs font-mono uppercase tracking-widest text-slate">
                    <th className="pb-3 font-bold">Document Name</th>
                    <th className="pb-3 font-bold">Pages</th>
                    <th className="pb-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {docs.slice(0, 8).map((d) => {
                    const isSelected = activeDocId === d.id
                    return (
                      <tr
                        key={d.id}
                        onClick={() => selectDocumentForChat(d)}
                        className={`hover:bg-amber-50/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-50/70 border-l-4 border-amber' : ''
                        }`}
                      >
                        <td className="py-3.5 font-medium text-slate-800 pr-4 break-all flex items-center gap-3">
                          <svg className={`h-5 w-5 shrink-0 ${isSelected ? 'text-amber' : 'text-slate'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className={isSelected ? 'text-amber font-semibold' : ''}>{d.filename}</span>
                        </td>
                        <td className="py-3.5 font-mono text-xs text-slate">{d.page_count} pages</td>
                        <td className="py-3.5 text-right">
                          {d.status === 'ready' && (
                            <span className="inline-flex rounded-full bg-verified/10 border border-verified/20 px-2.5 py-0.5 text-xs font-mono text-verified font-medium">
                              ready
                            </span>
                          )}
                          {d.status === 'processing' && (
                            <span className="inline-flex rounded-full bg-amber/10 border border-amber/20 px-2.5 py-0.5 text-xs font-mono text-amber font-medium animate-pulse">
                              processing
                            </span>
                          )}
                          {d.status === 'failed' && (
                            <span className="inline-flex rounded-full bg-rust/10 border border-rust/20 px-2.5 py-0.5 text-xs font-mono text-rust font-medium">
                              failed
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dashboard Drag & Drop Ingestion Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFileUpload(e.dataTransfer.files)
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 cursor-pointer shadow-sm flex items-center justify-between ${
            dragOver
              ? 'border-amber bg-amber-50/20 scale-[1.005]'
              : 'border-ink/10 bg-white hover:border-amber/50'
          }`}
        >
          <div className="flex items-center gap-4 text-left">
            <div className="rounded-full bg-paper p-2.5 text-amber shadow-inner">
              <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Add documents to your knowledge base</p>
              <p className="text-xs text-slate mt-0.5">Drag & drop your PDF manuals or policy handbooks directly here</p>
            </div>
          </div>
          <label className="cursor-pointer rounded-lg bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-md shrink-0">
            {uploading ? 'Uploading…' : 'Upload Document'}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* RIGHT COLUMN: Chat Assistant Split Pane */}
      <div className="w-[450px] border-l border-ink/10 bg-white flex flex-col h-full shadow-2xl relative shrink-0">
        {activeDoc ? (
          <>
            {/* Active Document Header */}
            <div className="border-b border-ink/10 p-5 bg-paper/30 backdrop-blur-md">
              <span className="rounded-full bg-verified/10 border border-verified/20 px-2.5 py-0.5 text-[10px] font-mono text-verified flex items-center gap-1.5 font-bold w-fit mb-2">
                <span className="h-1 w-1 rounded-full bg-verified animate-ping"></span>
                Isolated Context
              </span>
              <h2 className="font-display text-lg font-semibold text-slate-800 break-words leading-tight">
                Chat with Document
              </h2>
              <p className="text-xs text-slate truncate mt-1">
                Active: {activeDoc.filename}
              </p>
            </div>

            {/* Chat Messages Panel */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-paper/5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto opacity-70">
                  <svg className="h-8 w-8 text-slate mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-800">Ask a question</p>
                  <p className="text-xs text-slate mt-1">Queries are locked strictly to this document context.</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-ink text-paper rounded-tr-sm'
                          : m.refused
                          ? 'bg-rust/5 border border-rust/10 text-rust rounded-tl-sm font-medium'
                          : 'bg-white border border-ink/10 rounded-tl-sm text-slate-800'
                      }`}
                    >
                      {m.refused && (
                        <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-rust font-bold">
                          Strict Grounding Refusal
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.citations?.length > 0 && (
                        <div className="mt-2.5 border-t border-ink/5 pt-1.5 flex flex-wrap gap-1.5 items-center">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-slate font-bold">
                            Sources:
                          </span>
                          {m.citations.map((c, idx) => (
                            <CitationChip key={idx} document={c.document} page={c.page} snippet={c.snippet} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-ink/10 p-4 bg-white">
              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={sending}
                  placeholder={`Ask about ${activeDoc.filename}...`}
                  className="flex-1 rounded-lg border border-ink/15 px-3 py-2.5 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 disabled:bg-paper/50"
                />
                <button
                  type="submit"
                  disabled={sending || !chatInput.trim()}
                  className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink/90 active:scale-95 transition-all shadow-md disabled:opacity-50 shrink-0"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
              <p className="text-[10px] text-center text-slate font-mono font-medium mt-2">
                Answers are generated only from the selected document.
              </p>
            </div>
          </>
        ) : (
          /* Empty Chat Placeholder Screen */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/10 via-white to-white">
            <div className="rounded-full bg-paper p-4 text-amber shadow-inner mb-4">
              <svg className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-medium text-slate-800">Unified Knowledge Hub</h3>
            <p className="text-sm text-slate mt-2 max-w-xs leading-relaxed">
              Select a PDF document from the recent list on the left to activate the side-by-side chat workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, subtitle, icon }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-slate font-bold">{label}</p>
        <p className="mt-2 font-display text-3xl font-semibold text-slate-800">{value}</p>
        {subtitle && <p className="mt-1.5 text-xs text-slate font-medium">{subtitle}</p>}
      </div>
      <div className="rounded-xl bg-paper p-3 text-amber shadow-inner shrink-0">
        {icon}
      </div>
    </div>
  )
}
