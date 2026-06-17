import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Upload, Users, Calendar, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import Papa from 'papaparse'

const STEPS = [
  { n: 1, title: 'Upload company logo',   icon: Upload },
  { n: 2, title: 'Add HR Head',           icon: Users },
  { n: 3, title: 'Add first leaders',     icon: Users },
  { n: 4, title: 'Set survey schedule',   icon: Calendar },
]

export default function OnboardingPage() {
  const { company, profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [logoUrl, setLogoUrl] = useState('')
  const [hrHead, setHrHead] = useState({ name: '', email: '', phone: '' })
  const [leaders, setLeaders] = useState([{ name: '', email: '', phone: '' }])
  const [surveyDay, setSurveyDay] = useState(1)
  const [closeDay, setCloseDay] = useState(7)
  const [saving, setSaving] = useState(false)

  async function uploadLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `logos/${company?.id}.${ext}`
    const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); return }
    const { data } = supabase.storage.from('company-assets').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    await supabase.from('companies').update({ logo_url: data.publicUrl }).eq('id', company?.id)
    toast.success('Logo uploaded!')
  }

  async function saveHrHead() {
    if (!hrHead.name || !hrHead.email) { toast.error('Name and email required'); return }
    setSaving(true)
    const { error } = await supabase.from('users').insert({
      company_id: company?.id, full_name: hrHead.name,
      email: hrHead.email, phone: hrHead.phone, role: 'hr_head'
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('HR Head added!')
    setStep(3)
  }

  function addLeaderRow() { setLeaders(l => [...l, { name: '', email: '', phone: '' }]) }

  function updateLeader(i, k, v) {
    setLeaders(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  }

  async function handleCSV(e) {
    const file = e.target.files[0]
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed = data.map(r => ({ name: r.name || r.Name || '', email: r.email || r.Email || '', phone: r.phone || r.Phone || '' }))
        setLeaders(parsed)
        toast.success(`${parsed.length} leaders loaded from CSV`)
      }
    })
  }

  async function saveLeaders() {
    const valid = leaders.filter(l => l.name && l.email)
    if (!valid.length) { toast.error('Add at least one leader'); return }
    setSaving(true)
    const rows = valid.map(l => ({ company_id: company?.id, full_name: l.name, email: l.email, phone: l.phone, role: 'leader' }))
    const { error } = await supabase.from('users').upsert(rows, { onConflict: 'company_id,email' })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(`${valid.length} leaders saved!`)
    setStep(4)
  }

  async function finishSetup() {
    setSaving(true)
    // Create first campaign for current month
    const now = new Date()
    const opens = new Date(now.getFullYear(), now.getMonth(), surveyDay)
    const closes = new Date(now.getFullYear(), now.getMonth(), closeDay, 23, 59)
    const { error } = await supabase.from('survey_campaigns').insert({
      company_id: company?.id,
      name: opens.toLocaleString('default', { month: 'long', year: 'numeric' }),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      opens_at: opens.toISOString(),
      closes_at: closes.toISOString(),
      status: opens <= now ? 'active' : 'scheduled',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Setup complete! Welcome to NFR.')
    navigate('/dashboard')
  }

  const progress = ((step - 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">N</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">Setting up your NFR workspace</div>
          <div className="text-sm text-gray-400 mt-1">Step {step} of {STEPS.length}</div>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {STEPS.map(s => (
            <div key={s.n} className={`flex-1 h-1.5 rounded-full transition-all ${step >= s.n ? 'bg-brand-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="card">
          {/* Step 1: Logo */}
          {step === 1 && (
            <div>
              <div className="text-base font-semibold mb-1">Upload your company logo</div>
              <div className="text-sm text-gray-400 mb-6">Appears on all PDF reports alongside the MI logo</div>
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 transition-colors">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="h-16 mx-auto object-contain" />
                  : <div><Upload size={28} className="mx-auto text-gray-300 mb-2" /><div className="text-sm text-gray-400">Click to upload PNG or JPG</div></div>
                }
                <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              </label>
              <div className="flex justify-between mt-6">
                <button className="btn text-gray-400" onClick={() => setStep(2)}>Skip for now</button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: HR Head */}
          {step === 2 && (
            <div>
              <div className="text-base font-semibold mb-1">Add your HR Head</div>
              <div className="text-sm text-gray-400 mb-6">HR Head receives all leaders' reports and has full visibility</div>
              <div className="form-group">
                <label className="label">Full name *</label>
                <input className="input" placeholder="Priya Sharma" value={hrHead.name}
                  onChange={e => setHrHead(h => ({ ...h, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Email *</label>
                <input className="input" type="email" placeholder="priya@company.com" value={hrHead.email}
                  onChange={e => setHrHead(h => ({ ...h, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Phone (for WhatsApp reminders)</label>
                <input className="input" placeholder="+91 98765 43210" value={hrHead.phone}
                  onChange={e => setHrHead(h => ({ ...h, phone: e.target.value }))} />
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn" onClick={() => setStep(1)}><ArrowLeft size={14} /></button>
                <button className="btn btn-primary flex-1 justify-center" onClick={saveHrHead} disabled={saving}>
                  {saving ? 'Saving...' : 'Save & continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Leaders */}
          {step === 3 && (
            <div>
              <div className="text-base font-semibold mb-1">Add leaders to be surveyed</div>
              <div className="text-sm text-gray-400 mb-4">These are the people who will receive 360° NFR feedback each month</div>

              <label className="btn btn-sm mb-4 cursor-pointer">
                <Upload size={13} /> Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              </label>
              <div className="text-xs text-gray-400 mb-4">CSV columns: name, email, phone</div>

              <div className="max-h-52 overflow-y-auto flex flex-col gap-2 mb-4">
                {leaders.map((l, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input className="input text-xs" placeholder="Full name" value={l.name}
                      onChange={e => updateLeader(i, 'name', e.target.value)} />
                    <input className="input text-xs" placeholder="Email" value={l.email}
                      onChange={e => updateLeader(i, 'email', e.target.value)} />
                    <input className="input text-xs" placeholder="Phone" value={l.phone}
                      onChange={e => updateLeader(i, 'phone', e.target.value)} />
                  </div>
                ))}
              </div>
              <button className="btn btn-sm mb-4" onClick={addLeaderRow}>+ Add row</button>

              <div className="flex gap-2">
                <button className="btn" onClick={() => setStep(2)}><ArrowLeft size={14} /></button>
                <button className="btn btn-primary flex-1 justify-center" onClick={saveLeaders} disabled={saving}>
                  {saving ? 'Saving...' : `Save ${leaders.filter(l => l.name && l.email).length} leaders`}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Survey schedule */}
          {step === 4 && (
            <div>
              <div className="text-base font-semibold mb-1">Set monthly survey schedule</div>
              <div className="text-sm text-gray-400 mb-6">Surveys auto-open and close on these dates every month</div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label className="label">Opens on (day of month)</label>
                  <select className="input" value={surveyDay} onChange={e => setSurveyDay(+e.target.value)}>
                    {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}{d===1?'st':d===2?'nd':d===3?'rd':'th'}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Closes on (day of month)</label>
                  <select className="input" value={closeDay} onChange={e => setCloseDay(+e.target.value)}>
                    {[5,6,7,8,9,10].map(d => <option key={d} value={d}>{d}{d===5?'th':d===6?'th':d===7?'th':d===8?'th':d===9?'th':'th'}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-800 mb-6">
                <div className="font-medium mb-1">Reminder schedule</div>
                <div className="text-xs text-brand-700 space-y-1">
                  <div>• Day {surveyDay} — Survey opens, invites sent to all raters</div>
                  <div>• Day {surveyDay + 2} — Reminder to pending raters</div>
                  <div>• Day {closeDay - 1} — Final 24hr urgent reminder</div>
                  <div>• Day {closeDay} — Survey closes, results sent to leader, supervisor & HR</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => setStep(3)}><ArrowLeft size={14} /></button>
                <button className="btn btn-primary flex-1 justify-center" onClick={finishSetup} disabled={saving}>
                  {saving ? 'Finishing setup...' : '🎉 Complete setup'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Done steps */}
        <div className="mt-4 flex flex-col gap-1.5">
          {STEPS.filter(s => s.n < step).map(s => (
            <div key={s.n} className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle size={13} /> {s.title} — done
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
