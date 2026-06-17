import { useEffect, useState } from 'react'
import { Plus, Play, Pause, Square, CalendarDays } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
  active:    'badge-green',
  paused:    'badge-amber',
  closed:    'badge-gray',
  scheduled: 'badge-blue',
}

export default function ManageCampaigns() {
  const { company } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const now = new Date()
  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    opens_at: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`,
    closes_at: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-07`,
  })

  useEffect(() => { if (company?.id) load() }, [company])

  async function load() {
    const { data } = await supabase.from('survey_campaigns').select('*')
      .eq('company_id', company.id).order('year', { ascending: false }).order('month', { ascending: false })
    setCampaigns(data || [])
  }

  async function createCampaign(e) {
    e.preventDefault()
    setSaving(true)
    const monthName = new Date(form.year, form.month - 1).toLocaleString('default', { month: 'long' })
    const { error } = await supabase.from('survey_campaigns').insert({
      company_id: company.id,
      name: `${monthName} ${form.year}`,
      month: form.month,
      year: form.year,
      opens_at: new Date(form.opens_at).toISOString(),
      closes_at: new Date(form.closes_at + 'T23:59:59').toISOString(),
      status: new Date(form.opens_at) <= now ? 'active' : 'scheduled',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Campaign created!')
    setShowForm(false); load()
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('survey_campaigns').update({ status }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Campaign ${status}`)
    load()
  }

  async function extendCampaign(campaign) {
    const closes = new Date(campaign.closes_at)
    closes.setDate(closes.getDate() + 3)
    const { error } = await supabase.from('survey_campaigns').update({ closes_at: closes.toISOString() }).eq('id', campaign.id)
    if (error) { toast.error(error.message); return }
    toast.success('Extended by 3 days'); load()
  }

  return (
    <div>
      <div className="page-title">Survey Campaigns</div>
      <div className="page-sub">Monthly NFR surveys — create, pause, extend or close campaigns</div>

      <div className="flex justify-end mb-5">
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> New campaign
        </button>
      </div>

      {showForm && (
        <div className="card mb-5 border-brand-100 bg-brand-50/30">
          <div className="font-medium text-sm mb-4">Create campaign</div>
          <form onSubmit={createCampaign} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Month</label>
              <select className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: +e.target.value }))}>
                {Array.from({length:12},(_,i) => i+1).map(m => (
                  <option key={m} value={m}>{new Date(2024, m-1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))}>
                {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Opens on</label>
              <input className="input" type="date" value={form.opens_at}
                onChange={e => setForm(f => ({ ...f, opens_at: e.target.value }))} />
            </div>
            <div>
              <label className="label">Closes on</label>
              <input className="input" type="date" value={form.closes_at}
                onChange={e => setForm(f => ({ ...f, closes_at: e.target.value }))} />
            </div>
            <div className="col-span-2 sm:col-span-4 flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Creating...' : 'Create campaign'}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {campaigns.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <CalendarDays size={32} className="mx-auto mb-2 text-gray-300" />
            <div className="text-sm">No campaigns yet. Create your first one above.</div>
          </div>
        ) : campaigns.map(c => {
          const opens = new Date(c.opens_at)
          const closes = new Date(c.closes_at)
          const daysLeft = Math.max(0, Math.ceil((closes - now) / (1000*60*60*24)))
          return (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <span className={`badge ${STATUS_BADGE[c.status] || 'badge-gray'} capitalize`}>{c.status}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {opens.toLocaleDateString('en-IN', { day:'numeric', month:'short' })} →{' '}
                    {closes.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    {c.status === 'active' && <span className="ml-2 text-brand-600 font-medium">{daysLeft} days left</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {c.status === 'active' && <>
                    <button className="btn btn-sm" onClick={() => updateStatus(c.id, 'paused')}><Pause size={12}/> Pause</button>
                    <button className="btn btn-sm" onClick={() => extendCampaign(c)}>+ 3 days</button>
                    <button className="btn btn-sm text-red-400 border-red-100 hover:bg-red-50" onClick={() => updateStatus(c.id, 'closed')}><Square size={12}/> Close</button>
                  </>}
                  {c.status === 'paused' && <>
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(c.id, 'active')}><Play size={12}/> Resume</button>
                    <button className="btn btn-sm text-red-400 border-red-100 hover:bg-red-50" onClick={() => updateStatus(c.id, 'closed')}><Square size={12}/> Close</button>
                  </>}
                  {c.status === 'scheduled' && (
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(c.id, 'active')}><Play size={12}/> Launch now</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
