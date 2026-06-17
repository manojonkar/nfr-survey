import { useEffect, useState } from 'react'
import { Users, ClipboardList, CheckCircle, TrendingUp, AlertCircle, Play, Pause } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { company, profile } = useAuth()
  const [stats, setStats] = useState({ leaders: 0, raters: 0, campaigns: 0, responses: 0 })
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!company?.id) return
    loadDashboard()
  }, [company])

  async function loadDashboard() {
    setLoading(true)
    const [{ count: leaders }, { count: raters }, { data: campaigns }, { count: responses }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('role', 'leader'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('role', 'rater'),
      supabase.from('survey_campaigns').select('*').eq('company_id', company.id).in('status', ['active', 'paused']).limit(1),
      supabase.from('survey_responses').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
    ])
    setStats({ leaders: leaders || 0, raters: raters || 0, campaigns: campaigns?.length || 0, responses: responses || 0 })
    setActiveCampaign(campaigns?.[0] || null)
    setLoading(false)
  }

  async function toggleCampaign() {
    if (!activeCampaign) return
    const newStatus = activeCampaign.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('survey_campaigns').update({ status: newStatus }).eq('id', activeCampaign.id)
    if (error) { toast.error(error.message); return }
    setActiveCampaign(c => ({ ...c, status: newStatus }))
    toast.success(`Campaign ${newStatus}`)
  }

  const now = new Date()
  const closes = activeCampaign ? new Date(activeCampaign.closes_at) : null
  const daysLeft = closes ? Math.max(0, Math.ceil((closes - now) / (1000 * 60 * 60 * 24))) : null

  return (
    <div>
      <div className="page-title">Welcome back, {profile?.full_name?.split(' ')[0]} 👋</div>
      <div className="page-sub">{company?.name} · NFR Dashboard</div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Leaders enrolled', value: stats.leaders, icon: Users,         color: 'text-brand-600' },
          { label: 'Active raters',    value: stats.raters,  icon: Users,         color: 'text-green-600' },
          { label: 'Surveys submitted',value: stats.responses, icon: ClipboardList, color: 'text-amber-600' },
          { label: 'Active campaigns', value: stats.campaigns, icon: TrendingUp,   color: 'text-purple-600' },
        ].map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400">{m.label}</div>
                <Icon size={16} className={m.color} />
              </div>
              <div className={`text-3xl font-semibold ${m.color}`}>{loading ? '—' : m.value}</div>
            </div>
          )
        })}
      </div>

      {/* Active campaign card */}
      {activeCampaign ? (
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="sec-title">Active survey campaign</div>
              <div className="text-lg font-semibold text-gray-900">{activeCampaign.name}</div>
              <div className="text-sm text-gray-400 mt-1">
                {new Date(activeCampaign.opens_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {' → '}
                {new Date(activeCampaign.closes_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${daysLeft <= 2 ? 'text-red-500' : 'text-brand-600'}`}>{daysLeft}</div>
              <div className="text-xs text-gray-400">days left</div>
            </div>
          </div>
          <div className="divider" />
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`badge ${activeCampaign.status === 'active' ? 'badge-green' : 'badge-amber'}`}>
              {activeCampaign.status === 'active' ? '● Active' : '⏸ Paused'}
            </span>
            <button onClick={toggleCampaign} className="btn btn-sm">
              {activeCampaign.status === 'active' ? <><Pause size={12} /> Pause campaign</> : <><Play size={12} /> Resume campaign</>}
            </button>
            <button onClick={() => {
              const ext = new Date(activeCampaign.closes_at)
              ext.setDate(ext.getDate() + 3)
              supabase.from('survey_campaigns').update({ closes_at: ext.toISOString() }).eq('id', activeCampaign.id)
                .then(() => { toast.success('Extended by 3 days'); loadDashboard() })
            }} className="btn btn-sm">
              + Extend 3 days
            </button>
          </div>
        </div>
      ) : (
        <div className="card mb-6 border-dashed border-2 border-gray-200 text-center py-8">
          <AlertCircle size={28} className="mx-auto text-gray-300 mb-2" />
          <div className="text-sm font-medium text-gray-500">No active campaign</div>
          <div className="text-xs text-gray-400 mb-4">Go to Campaigns to create one</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="sec-title">Quick actions</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Add a leader',          href: '/dashboard/users',     color: 'bg-brand-50 text-brand-700' },
          { label: 'Add raters',            href: '/dashboard/users',     color: 'bg-green-50 text-green-700' },
          { label: 'View org analytics',    href: '/dashboard/analytics', color: 'bg-purple-50 text-purple-700' },
        ].map(a => (
          <a key={a.label} href={a.href}
            className={`${a.color} rounded-xl p-4 text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-2`}>
            <CheckCircle size={14} /> {a.label}
          </a>
        ))}
      </div>
    </div>
  )
}
