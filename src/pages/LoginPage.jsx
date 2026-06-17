import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      toast.error(error.message || 'Invalid email or password')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="font-semibold text-gray-900">NFR<span className="text-brand-600">Company</span></span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-6">Sign in to your NFR dashboard</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <div className="text-center mt-4 text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-brand-600 font-medium">Start free trial</Link>
        </div>
      </div>
    </div>
  )
}
