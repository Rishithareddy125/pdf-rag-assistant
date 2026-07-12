import { useState } from 'react'

/**
 * Signature element: every grounded claim carries a citation chip.
 * Click to expand the exact source snippet — this is the product's
 * whole trust proposition made visible, not decoration.
 */
export default function CitationChip({ document, page, snippet }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-block align-baseline">
      <button
        onClick={() => setOpen((o) => !o)}
        className="mx-0.5 inline-flex items-center gap-1 rounded-sm border border-amber/40 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber hover:border-amber"
      >
        {document}, p.{typeof page === 'number' ? Math.round(page) : parseInt(page) || page}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-10 mt-1 block w-72 rounded border border-ink/10 bg-paper p-3 text-xs text-ink shadow-lg">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-slate">
            Source snippet
          </span>
          <span className="block font-body leading-relaxed">{snippet}</span>
        </span>
      )}
    </span>
  )
}
