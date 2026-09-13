import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, googleLogin } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      navigate('/onboarding')
    } catch (err) {
      const serverMsg = err.response?.data?.error
        || err.response?.data?.errors?.[0]?.message
        || err.response?.data?.message
        || 'Registration failed. Try again.'
      setError(serverMsg)
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
      setError(err.response?.data?.error || err.response?.data?.message || 'Google signup failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google signup failed.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-7">
            <span className="text-4xl">🌾</span>
            <h1 className="font-heading font-bold text-2xl text-gray-900 mt-2">Create Account</h1>
            <p className="text-sm text-gray-500 mt-1 font-body">Start farming smarter with AI</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-5 font-body">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="pill"
              text="signup_with"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-body">or create an account with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input id="name" name="name" type="text" required value={form.name}
                onChange={handleChange} placeholder="Ramesh Patel" className="input-field" />
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email Address</label>
              <input id="reg-email" name="email" type="email" required value={form.email}
                onChange={handleChange} placeholder="farmer@example.com" className="input-field" />
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone Number</label>
              <input id="phone" name="phone" type="tel" required value={form.phone}
                onChange={handleChange} placeholder="9876543210" className="input-field" />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input id="reg-password" name="password" type="password" required value={form.password}
                onChange={handleChange} placeholder="Min. 8 characters" className="input-field" />
            </div>

            <div>
              <label htmlFor="confirm" className="label">Confirm Password</label>
              <input id="confirm" name="confirm" type="password" required value={form.confirm}
                onChange={handleChange} placeholder="Re-enter password" className="input-field" />
            </div>

            <button type="submit" id="btn-register" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 font-body">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to="/" className="hover:text-primary transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
