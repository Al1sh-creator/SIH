import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, googleLogin, demoLogin } = useAuth()
  const navigate             = useNavigate()
  const [form, setForm]      = useState({ email: '', password: '' })
  const [error, setError]    = useState('')
  const [loading, setLoading]  = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form.email, form.password)
      // If profile not set up yet → onboarding, else → dashboard
      navigate(res.user?.profile_completed ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setLoading(true)
    try {
      const res = await googleLogin(credentialResponse.credential)
      navigate(res.user?.profile_completed ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Google login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google login failed.')
  }

  const handleDemo = async () => {
    setDemoLoading(true)
    // Small delay so it feels intentional
    await new Promise((r) => setTimeout(r, 600))
    demoLogin()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-4xl">🌾</span>
            <h1 className="font-heading font-bold text-2xl text-gray-900 mt-2">Welcome Back</h1>
            <p className="text-sm text-gray-500 mt-1 font-body">Sign in to your FarmSense AI account</p>
          </div>

          {/* Demo mode banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">🧪</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 font-body">Backend not connected yet?</p>
                <p className="text-xs text-amber-700 mt-0.5 font-body leading-relaxed">
                  Use <strong>Demo Mode</strong> to explore all features with realistic sample data — no signup or server needed.
                </p>
                <button
                  onClick={handleDemo}
                  disabled={demoLoading}
                  id="btn-demo-login"
                  className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {demoLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading demo…
                    </>
                  ) : (
                    <>🚀 Try Demo Mode — no account needed</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="pill"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-body">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-5 font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="farmer@example.com"
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="label">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-body">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              id="btn-login"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 font-body">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Register here</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to="/" className="hover:text-primary transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
