import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.getSession()
      .then(u => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false))

    // the API client fires this when the saved login token has expired
    const onExpired = () => setUser(null)
    window.addEventListener('pawmate:logout', onExpired)
    return () => {
      alive = false
      window.removeEventListener('pawmate:logout', onExpired)
    }
  }, [])

  const login = useCallback(async creds => {
    const u = await api.login(creds)
    setUser(u)
    return u
  }, [])

  const signup = useCallback(async data => {
    const u = await api.signup(data)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const u = await api.getSession()
    setUser(u)
    return u
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refresh, setUser }),
    [user, loading, login, signup, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export const isOwner = user => user && ['owner', 'both'].includes(user.role)
export const isWalker = user => user && ['walker', 'both'].includes(user.role)
