import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as loginApi, register as registerApi, googleLogin as googleLoginApi, getMe } from '../api/authApi'
import { MOCK_USER } from '../mock/mockData'

const AuthContext = createContext(null)

const DEMO_TOKEN = 'DEMO_MODE_TOKEN'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount — supports both real JWT and demo token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    // Demo mode — no API needed
    if (token === DEMO_TOKEN) {
      setUser(MOCK_USER)
      setLoading(false)
      return
    }

    // Real login
    getMe()
      .then((res) => {
        // getMe returns { user: {...}, farm: {...} }
        // merge profile_completed from farm if present
        const userData = res.data.user || res.data
        if (res.data.farm) {
          userData.profile_completed = true
        }
        setUser(userData)
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await loginApi({ email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }, [])

  const register = useCallback(async (data) => {
    const res = await registerApi(data)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }, [])

  const googleLogin = useCallback(async (credential) => {
    const res = await googleLoginApi({ credential })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }, [])
  // Demo login — sets a fake token, no API call
  const demoLogin = useCallback(() => {
    localStorage.setItem('token', DEMO_TOKEN)
    setUser(MOCK_USER)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const isDemo = localStorage.getItem('token') === DEMO_TOKEN

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, demoLogin, isDemo, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
