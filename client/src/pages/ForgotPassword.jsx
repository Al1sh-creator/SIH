import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/apiClient'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">

          <div className="text-center mb-8">
            <span className="text-4xl">🔑</span>
            <h1 className="font-heading font-bold text-2xl text-gray-900 mt-2">Forgot Password</h1>
            <p className="text-sm text-gray-500 mt-1 font-body">
              Enter your email and we'll send a reset link
            </p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <span className="text-4xl">📬</span>
                <p className="text-green-800 font-semibold mt-3 font-body">Check your inbox!</p>
                <p className="text-green-700 text-sm mt-1 font-body">
                  If <strong>{email}</strong> is registered, a password reset
                  link has been sent. It expires in 1 hour.
                </p>
              </div>
              <Link to="/login" className="text-primary text-sm font-medium hover:underline">
                ← Back to Login
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
                  <label htmlFor="email" className="label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
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
                      Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 font-body">
                Remember your password?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
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
