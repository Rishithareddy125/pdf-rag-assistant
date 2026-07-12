import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signup(name, email, password)
      navigate('/login', { state: { message: 'Account created successfully! Please sign in below.' } })
    } catch (err) {
      setError(err.message || 'Could not create your account. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ink/90 via-ink to-ink px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center animate-fadeIn">
          <p className="font-display text-4xl text-paper tracking-tight font-semibold">DocuMind</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-amber font-bold mt-1">Enterprise Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-paper p-10 shadow-2xl border border-white/10 backdrop-blur-md">
          <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">Create account</h1>
          <p className="mb-6 text-sm text-slate">Set up access to your team's DocuMind workspace.</p>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-rust/20 bg-rust/5 px-3 py-3 text-sm text-rust font-semibold shadow-sm animate-fadeIn">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate font-bold">
                Full name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all font-medium"
                placeholder="Priya Sharma"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate font-bold">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all font-medium"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate font-bold">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all font-medium"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-3 text-sm font-semibold text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98] mt-8"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>

          <p className="mt-6 text-center text-sm text-slate font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-amber hover:underline font-bold transition-all">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
