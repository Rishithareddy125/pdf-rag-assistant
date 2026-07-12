import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Missing token. Please request a new password reset link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await api.resetPassword(token, password)
      navigate('/login', {
        state: { message: 'Password reset successful! You can now sign in with your new password.' },
      })
    } catch (err) {
      setError(err.message || 'The reset link is invalid, expired, or something went wrong.')
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
          <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">Reset Password</h1>
          <p className="mb-6 text-sm text-slate">Set your new password below.</p>

          {!token && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-rust/20 bg-rust/5 px-3 py-3 text-sm text-rust font-semibold shadow-sm animate-fadeIn">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Error: No reset token detected in the URL. Please check the link.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-rust/20 bg-rust/5 px-3 py-3 text-sm text-rust font-semibold shadow-sm animate-fadeIn">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate font-bold">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all font-medium"
                placeholder="Minimum 8 characters"
                disabled={busy || !token}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-widest text-slate font-bold">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20 transition-all font-medium"
                placeholder="Confirm password"
                disabled={busy || !token}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !token}
            className="w-full rounded-lg bg-ink py-3 text-sm font-semibold text-paper hover:bg-ink/90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98] mt-8"
          >
            {busy ? 'Resetting password…' : 'Reset password'}
          </button>

          <p className="mt-6 text-center text-sm text-slate font-medium">
            <Link to="/login" className="text-amber hover:underline font-bold transition-all">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
