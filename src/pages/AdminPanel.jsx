import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function AdminPanel() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.adminListUsers(token).then(setUsers).catch(() => setUsers([]))
    api.adminStats(token).then(setStats).catch(() => setStats(null))
  }, [token])

  return (
    <div className="p-10">
      <p className="font-mono text-xs uppercase tracking-widest text-amber">Administration</p>
      <h1 className="mb-8 font-display text-3xl">Admin panel</h1>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <Stat label="Total users" value={stats?.total_users ?? '—'} />
        <Stat label="Documents" value={stats?.total_documents ?? '—'} />
        <Stat label="Chats this week" value={stats?.chats_this_week ?? '—'} />
        <Stat label="Refusal rate" value={stats?.refusal_rate ? `${stats.refusal_rate}%` : '—'} />
      </div>

      <div className="rounded-md border border-ink/10 bg-white">
        <div className="border-b border-ink/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-slate">
          Users
        </div>
        {users.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate">No users to show.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-xs font-mono uppercase tracking-widest text-slate">
                <th className="px-6 py-2 font-normal">Name</th>
                <th className="px-6 py-2 font-normal">Email</th>
                <th className="px-6 py-2 font-normal">Role</th>
                <th className="px-6 py-2 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink/5 last:border-none">
                  <td className="px-6 py-3">{u.name}</td>
                  <td className="px-6 py-3">{u.email}</td>
                  <td className="px-6 py-3 capitalize">{u.role}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-slate">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  )
}
