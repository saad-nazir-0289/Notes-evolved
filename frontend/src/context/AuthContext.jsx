import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginApi, register as registerApi } from '../api/auth'
import { clearAccessToken, readAccessToken, saveAccessToken } from '../utils/authSession'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)
  const [sessionVersion, setSessionVersion] = useState(0)

  useEffect(() => {
    let active = true

    if (!readAccessToken()) {
      setStatus('unauthenticated')
      return () => { active = false }
    }

    getCurrentUser()
      .then((currentUser) => {
        if (!active) return
        setUser(currentUser)
        setSessionVersion((version) => version + 1)
        setStatus('authenticated')
      })
      .catch(() => {
        clearAccessToken()
        if (!active) return
        setUser(null)
        setStatus('unauthenticated')
      })

    return () => { active = false }
  }, [])

  const completeAuthentication = useCallback(async (request) => {
    const session = await request
    if (!session?.token || !session?.user) {
      throw new Error('The server returned an incomplete authentication response')
    }

    saveAccessToken(session.token)
    setUser(session.user)
    setSessionVersion((version) => version + 1)
    setStatus('authenticated')
    return session.user
  }, [])

  const login = useCallback(
    (credentials) => completeAuthentication(loginApi(credentials)),
    [completeAuthentication],
  )

  const register = useCallback(
    (credentials) => completeAuthentication(registerApi(credentials)),
    [completeAuthentication],
  )

  const logout = useCallback(() => {
    clearAccessToken()
    setUser(null)
    setSessionVersion((version) => version + 1)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(() => ({
    status,
    user,
    sessionVersion,
    login,
    register,
    logout,
  }), [status, user, sessionVersion, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
