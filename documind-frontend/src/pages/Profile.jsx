import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="p-10 bg-paper min-h-screen text-ink">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-amber font-semibold">Account</p>
        <h1 className="font-display text-4xl font-semibold">Profile</h1>
      </div>

      <div className="max-w-xl rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        {/* User Large Avatar Header */}
        <div className="flex items-center gap-6 border-b border-ink/5 pb-8 mb-6">
          <div className="h-20 w-20 rounded-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber/80 to-amber text-paper flex items-center justify-center font-mono font-bold text-3xl shadow-lg">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">{user?.name}</h2>
            <p className="text-sm text-slate mt-0.5">{user?.email}</p>
            <span className="mt-2.5 inline-flex rounded-full bg-verified/10 border border-verified/20 px-3 py-0.5 text-xs font-mono text-verified font-medium">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="grid grid-cols-2 gap-6">
          <Field 
            label="Full name" 
            value={user?.name} 
            icon={
              <svg className="h-5 w-5 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <Field 
            label="Work email" 
            value={user?.email} 
            icon={
              <svg className="h-5 w-5 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21.3 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <Field 
            label="Account Role" 
            value={user?.role} 
            icon={
              <svg className="h-5 w-5 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            }
          />
          <Field 
            label="Organization" 
            value={user?.organization || 'Personal Workspace'} 
            icon={
              <svg className="h-5 w-5 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-ink/5 bg-paper/30 p-4 flex items-start gap-3 shadow-inner">
      <div className="rounded-lg bg-white p-2 shadow-sm text-slate shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate font-bold">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}
