import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '', slug: '', emailDomain: '',
    adminName: '', adminEmail: '', password: '', confirmPassword: '',
  })

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'companyName') {
      setForm(f => ({ ...f, companyName: v, slug: v.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await signUp(form.adminEmail, form.password)
      if (authError) throw authError

      // 2. Create company
      const { data: company, error: compError } = await supabase.from('companies').insert({
        name: form.companyName,
        slug: form.slug,
        admin_email: form.adminEmail,
        email_domain: form.emailDomain,
      }).select().single()
      if (compError) throw compError

      // 3. Create admin user record
      const { error: userError } = await supabase.from('users').insert({
        company_id: company.id,
        email: form.adminEmail,
        full_name: form.adminName,
        role: 'company_admin',
      })
      if (userError) throw userError

      toast.success('Account created! Please check your email to verify.')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
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

      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Start your free trial</h1>
            <p className="text-sm text-gray-400">3 months free · No credit card required</p>
          </div>

          {/* Steps indicator */}
          <div className="flex gap-2 mb-6">
            {[1,2].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${step >= s ? 'bg-brand-600' : 'bg-gray-100'}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Company details</div>
                <div className="form-group">
                  <label className="label">Company name *</label>
                  <input className="input" placeholder="Acme Corporation" value={form.companyName}
                    onChange={e => set('companyName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Company URL slug *</label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-400">
                    <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">nfrcompany.com/</span>
                    <input className="flex-1 px-3 py-2.5 text-sm outline-none" placeholder="acme" value={form.slug}
                      onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Company email domain (optional)</label>
                  <input className="input" placeholder="acme.com" value={form.emailDomain}
                    onChange={e => set('emailDomain', e.target.value)} />
                  <div className="text-xs text-gray-400 mt-1">Used to auto-verify employees who self-register</div>
                </div>
                <button type="button" onClick={() => setStep(2)}
                  disabled={!form.companyName || !form.slug}
                  className="btn btn-primary w-full justify-center mt-2">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Admin account</div>
                <div className="form-group">
                  <label className="label">Your full name *</label>
                  <input className="input" placeholder="Manoj Onkar" value={form.adminName}
                    onChange={e => set('adminName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Work email *</label>
                  <input className="input" type="email" placeholder="manoj@company.com" value={form.adminEmail}
                    onChange={e => set('adminEmail', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Password *</label>
                  <input className="input" type="password" placeholder="Min 8 characters" value={form.password}
                    onChange={e => set('password', e.target.value)} required minLength={8} />
                </div>
                <div className="form-group">
                  <label className="label">Confirm password *</label>
                  <input className="input" type="password" placeholder="Repeat password" value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)} required />
                </div>
                <div className="bg-green-50 rounded-xl p-3 mb-4 text-xs text-green-700 flex gap-2">
                  <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>3-month free trial for <strong>{form.companyName || 'your company'}</strong>. No payment needed until trial ends.</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)} className="btn">Back</button>
                  <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="text-center mt-4 text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-brand-600 font-medium">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
