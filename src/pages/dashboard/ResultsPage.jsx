import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import toast from 'react-hot-toast'

const Q_LABELS = ['Proactive comms','SLA adherence','Delay comms','Promise reliability','Responsiveness']

function scorePill(v) {
  if (v === null || v === undefined) return <span className="score-pill score-zero">—</span>
  const s = parseFloat(v)
  const cls = s > 0.5 ? 'score-pos' : s < -0.5 ? 'score-neg' : 'score-zero'
  return <span className={`score-pill ${cls}`}>{s > 0 ? '+' : ''}{s.toFixed(1)}</span>
}

export default function ResultsPage() {
  const { profile, company } = useAuth()
  const [scores, setScores] = useState([])
  const [actions, setActions] = useState([])
  const [newAction, setNewAction] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.id) load() }, [profile])

  async function load() {
    setLoading(true)
    const { data: sc } = await supabase.from('leader_scores')
      .select('*, campaign:campaign_id(name, month, year)')
      .eq('leader_id', profile.id).order('created_at', { ascending: false }).limit(12)
    setScores(sc || [])
    const { data: ac } = await supabase.from('action_plans')
      .select('*').eq('leader_id', profile.id).order('created_at', { ascending: false })
    setActions(ac || [])
    setLoading(false)
  }

  const last = scores[0]
  const last3 = scores.slice(0, 3)
  const avg3 = last3.length ? (last3.reduce((s, x) => s + parseFloat(x.avg_score || 0), 0) / last3.length).toFixed(2) : null
  const avgAll = scores.length ? (scores.reduce((s, x) => s + parseFloat(x.avg_score || 0), 0) / scores.length).toFixed(2) : null

  const chartData = [...scores].reverse().map(s => ({
    name: s.campaign?.name || `${s.campaign?.month}/${s.campaign?.year}`,
    score: parseFloat(s.avg_score),
  }))

  async function addAction() {
    if (!newAction.trim()) return
    const { data, error } = await supabase.from('action_plans').insert({
      leader_id: profile.id, company_id: company.id,
      commitment: newAction, status: 'not-started'
    }).select().single()
    if (error) { toast.error(error.message); return }
    setActions(a => [data, ...a]); setNewAction(''); setShowAdd(false)
    toast.success('Action added')
  }

  async function updateActionStatus(id, status) {
    await supabase.from('action_plans').update({ status }).eq('id', id)
    setActions(a => a.map(x => x.id === id ? { ...x, status } : x))
  }

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Loading your results...</div>

  if (scores.length === 0) return (
    <div className="card text-center py-12 text-gray-400">
      <div className="text-sm">No results yet. Results appear once your first survey campaign closes.</div>
    </div>
  )

  return (
    <div>
      <div className="page-title">My NFR Results</div>
      <div className="page-sub">Averaged scores from all your raters · Names never shown</div>

      {/* 3 headline scores */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-xs text-gray-400 mb-2">This month</div>
          <div className={`text-4xl font-bold ${parseFloat(last?.avg_score) > 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {last?.avg_score ? (parseFloat(last.avg_score) > 0 ? '+' : '') + parseFloat(last.avg_score).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">{last?.raters_submitted}/{last?.raters_total} raters</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-400 mb-2">3-month avg</div>
          <div className={`text-4xl font-bold ${parseFloat(avg3) > 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {avg3 ? (parseFloat(avg3) > 0 ? '+' : '') + parseFloat(avg3).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">last {last3.length} months</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-400 mb-2">All-time avg</div>
          <div className={`text-4xl font-bold ${parseFloat(avgAll) > 0 ? 'text-brand-600' : 'text-red-500'}`}>
            {avgAll ? (parseFloat(avgAll) > 0 ? '+' : '') + parseFloat(avgAll).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">{scores.length} months</div>
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="card mb-6">
          <div className="sec-title">Score trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis domain={[-3, 3]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v > 0 ? `+${v}` : v} />
              <Tooltip formatter={v => [(v > 0 ? '+' : '') + v.toFixed(1), 'NFR Score']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <ReferenceLine y={0} stroke="#e5e7eb" />
              <Line type="monotone" dataKey="score" stroke="#185fa5" strokeWidth={2.5}
                dot={{ fill: '#185fa5', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dimension breakdown */}
      {last && (
        <div className="card mb-6">
          <div className="sec-title">This month — by dimension</div>
          <table className="table-base">
            <thead><tr><th>Dimension</th><th>Score</th></tr></thead>
            <tbody>
              {Q_LABELS.map((l, i) => {
                const key = `q${i+1}_avg`
                return (
                  <tr key={l}>
                    <td>{l}</td>
                    <td>{scorePill(last[key])}</td>
                  </tr>
                )
              })}
              <tr>
                <td className="font-medium">NFR declared by</td>
                <td className="font-medium text-green-600">{last.nfr_pct ? Math.round(last.nfr_pct) : 0}% of raters</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly history */}
      <div className="card mb-6">
        <div className="sec-title">Month-by-month history</div>
        <table className="table-base">
          <thead><tr><th>Month</th><th>Overall</th><th>Raters</th><th>NFR %</th></tr></thead>
          <tbody>
            {scores.map(s => (
              <tr key={s.id}>
                <td>{s.campaign?.name}</td>
                <td>{scorePill(s.avg_score)}</td>
                <td className="text-gray-400">{s.raters_submitted}/{s.raters_total}</td>
                <td className="text-gray-600">{s.nfr_pct ? Math.round(s.nfr_pct) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action plan */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="sec-title mb-0">My action plan</div>
          <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={12} /> Add commitment
          </button>
        </div>
        {showAdd && (
          <div className="bg-brand-50 rounded-xl p-3 mb-4">
            <input className="input mb-2" placeholder="What specific change will you make this month?"
              value={newAction} onChange={e => setNewAction(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAction()} autoFocus />
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={addAction}>Save</button>
              <button className="btn btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}
        {actions.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">No commitments yet</div>
        ) : (
          <table className="table-base">
            <thead><tr><th>Commitment</th><th>Status</th></tr></thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id}>
                  <td>{a.commitment}</td>
                  <td>
                    <select className="input text-xs py-1 w-auto"
                      value={a.status} onChange={e => updateActionStatus(a.id, e.target.value)}>
                      <option value="not-started">Not started</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done ✓</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
