import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('documind_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me(token)
      .then(setUser)
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('documind_token')
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password)
    localStorage.setItem('documind_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    await api.signup(name, email, password)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('documind_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
