import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { 
    to: '/dashboard', 
    label: 'Dashboard', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    )
  },
  { 
    to: '/upload', 
    label: 'Upload Documents', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
      </svg>
    )
  },
  { 
    to: '/chat', 
    label: 'Chat Assistant', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  { 
    to: '/history', 
    label: 'Chat History', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    to: '/profile', 
    label: 'Profile', 
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-ink/10 bg-ink text-paper">
      <div>
        <div className="border-b border-paper/10 px-6 py-6">
          <p className="font-display text-2xl tracking-tight font-semibold">DocuMind</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber font-bold">Enterprise</p>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-6 py-3.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-paper/10 text-paper border-l-4 border-amber font-semibold'
                    : 'text-paper/60 border-l-4 border-transparent hover:text-paper hover:bg-paper/5'
                }`
              }
            >
              <span className="shrink-0">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-6 py-3.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-paper/10 text-paper border-l-4 border-amber font-semibold'
                    : 'text-paper/60 border-l-4 border-transparent hover:text-paper hover:bg-paper/5'
                }`
              }
            >
              <span className="shrink-0">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </span>
              Admin Panel
            </NavLink>
          )}
        </nav>
      </div>

      <div className="border-t border-paper/10 px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-amber text-paper flex items-center justify-center font-mono font-bold shadow-md text-sm">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate font-mono text-[10px] text-paper/40">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="w-full text-center rounded-lg border border-rust/35 hover:bg-rust px-3 py-2 text-xs font-mono uppercase tracking-widest text-rust hover:text-paper transition-all font-semibold active:scale-[0.98]"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
