import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/apiClient'

export default function ResetPassword() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token')
  const navigate                = useNavigate()

  const [form, setForm]         = useState({ password: '', confirm: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }
    if (!token) {
      return setError('Invalid reset link. Please request a new one.')
    }

    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', {
        token,
        password: form.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <span className="text-4xl">⚠️</span>
          <h2 className="font-heading font-bold text-xl text-gray-900 mt-3">Invalid Link</h2>
          <p className="text-gray-500 text-sm mt-2 font-body">
            This reset link is invalid or missing. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-block mt-6">
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">

          <div className="text-center mb-8">
            <span className="text-4xl">🔒</span>
            <h1 className="font-heading font-bold text-2xl text-gray-900 mt-2">Set New Password</h1>
            <p className="text-sm text-gray-500 mt-1 font-body">
              Choose a strong password for your account
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <span className="text-4xl">✅</span>
                <p className="text-green-800 font-semibold mt-3 font-body">Password reset successful!</p>
                <p className="text-green-700 text-sm mt-1 font-body">
                  Redirecting to login in a moment…
                </p>
              </div>
              <Link to="/login" className="text-primary text-sm font-medium hover:underline">
                Go to Login now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5 font-body">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="label">New Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="label">Confirm New Password</label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    required
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className="input-field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting…
                    </span>
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to="/" className="hover:text-primary transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
