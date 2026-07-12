import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function UploadDocuments() {
  const { token } = useAuth()
  const [docs, setDocs] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const refresh = useCallback(() => {
    api.listDocuments(token).then(setDocs).catch(() => setDocs([]))
  }, [token])

  useEffect(() => {
    refresh()
    // Poll for document status updates every 4 seconds if any document is processing
    const hasProcessing = docs.some(d => d.status === 'processing')
    if (hasProcessing) {
      const interval = setInterval(refresh, 4000)
      return () => clearInterval(interval)
    }
  }, [docs, refresh])

  async function handleFiles(files) {
    setError('')
    setSuccessMessage('')
    const file = files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported right now.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.uploadDocument(token, formData)
      setSuccessMessage(`"${file.name}" uploaded successfully! It is now processing.`)
      refresh()
    } catch (err) {
      setError(err.message || 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id, filename) {
    setError('')
    setSuccessMessage('')
    setDeletingId(id)
    try {
      await api.deleteDocument(token, id)
      setSuccessMessage(`"${filename}" removed successfully.`)
      refresh()
    } catch (err) {
      setError(err.message || 'Failed to remove document.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-10 bg-paper min-h-screen text-ink">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber font-semibold">Knowledge base</p>
        <h1 className="font-display text-4xl font-semibold">Upload documents</h1>
      </div>

      {/* Advanced Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`relative mb-8 overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer shadow-sm ${
          dragOver 
            ? 'border-amber bg-amber-50/20 scale-[1.01]' 
            : 'border-ink/15 bg-white hover:border-amber/50 hover:shadow-md hover:scale-[1.005]'
        }`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-between rounded-full bg-paper p-3 text-amber shadow-inner">
          <svg className="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>

        <p className="mb-2 font-display text-xl font-medium">Drop a PDF here</p>
        <p className="mx-auto mb-6 max-w-md text-sm text-slate leading-relaxed">
          Upload technical policies, product specifications, or SOPs. DocuMind automatically splits text into contextual chunks for retrieval.
        </p>

        <label className="inline-block cursor-pointer rounded-lg bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-ink/90 shadow-md active:scale-95 transition-all">
          {uploading ? 'Processing file…' : 'Choose file'}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {successMessage && (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-verified/20 bg-verified/5 px-4 py-3.5 text-sm text-verified shadow-sm animate-fadeIn">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-rust/20 bg-rust/5 px-4 py-3.5 text-sm text-rust shadow-sm">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Modern Ingested Documents List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-slate font-bold">
            Ingested documents ({docs.length})
          </h2>
          {docs.some(d => d.status === 'processing') && (
            <span className="text-[11px] font-mono text-amber animate-pulse">
              ● auto-refreshing statuses...
            </span>
          )}
        </div>

        {docs.length === 0 ? (
          <div className="rounded-xl border border-ink/5 bg-white py-16 text-center shadow-sm">
            <p className="text-sm text-slate">Your knowledge base is empty.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {docs.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="rounded-lg bg-paper p-2.5 text-slate shadow-sm">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 break-all">{d.filename}</h3>
                    <p className="mt-1 font-mono text-xs text-slate">
                      {d.page_count} pages
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Styled Status Badge */}
                  {d.status === 'ready' && (
                    <span className="rounded-full bg-verified/10 border border-verified/20 px-3 py-1 text-xs font-mono text-verified flex items-center gap-1.5 font-medium shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-verified animate-ping"></span>
                      ready
                    </span>
                  )}
                  {d.status === 'processing' && (
                    <span className="rounded-full bg-amber/10 border border-amber/20 px-3 py-1 text-xs font-mono text-amber flex items-center gap-1.5 font-medium shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse"></span>
                      processing
                    </span>
                  )}
                  {d.status === 'failed' && (
                    <span className="rounded-full bg-rust/10 border border-rust/20 px-3 py-1 text-xs font-mono text-rust flex items-center gap-1.5 font-medium shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-rust"></span>
                      failed
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${d.filename}? This will remove it from search.`)) {
                        handleDelete(d.id, d.filename)
                      }
                    }}
                    disabled={deletingId === d.id}
                    className="rounded-lg border border-rust/20 px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-rust hover:bg-rust hover:text-white disabled:opacity-50 transition-all shadow-sm active:scale-95"
                  >
                    {deletingId === d.id ? 'Deleting…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
