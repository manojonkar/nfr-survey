import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts'

export default function AnalyticsPage() {
  const { company, profile } = useAuth()
  const [data, setData] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (company?.id) load() }, [company])

  async function load() {
    setLoading(true)
    const { data: camps } = await supabase.from('survey_campaigns').select('*')
      .eq('company_id', company.id).order('year', { ascending: false }).order('month', { ascending: false })
    setCampaigns(camps || [])
    const latest = camps?.[0]
    if (latest) {
      setSelectedCampaign(latest.id)
      await loadScores(latest.id)
    }
    // Trend: company avg per campaign
    if (camps?.length) {
      const trend = []
      for (const c of [...camps].reverse()) {
        const { data: sc } = await supabase.from('leader_scores')
          .select('avg_score').eq('company_id', company.id).eq('campaign_id', c.id)
        if (sc?.length) {
          const avg = sc.reduce((s, x) => s + parseFloat(x.avg_score || 0), 0) / sc.length
          trend.push({ name: c.name, score: parseFloat(avg.toFixed(2)) })
        }
      }
      setTrendData(trend)
    }
    setLoading(false)
  }

  async function loadScores(campaignId) {
    let query = supabase.from('leader_scores')
      .select('*, leader:leader_id(full_name)')
      .eq('company_id', company.id).eq('campaign_id', campaignId)
    if (profile?.role === 'supervisor') {
      const { data: reports } = await supabase.from('leader_supervisors')
        .select('leader_id').eq('supervisor_id', profile.id)
      const ids = (reports || []).map(r => r.leader_id)
      if (ids.length) query = query.in('leader_id', ids)
    }
    const { data: scores } = await query.order('avg_score', { ascending: false })
    setData(scores || [])
  }

  const chartData = data.map(s => ({
    name: s.leader?.full_name?.split(' ')[0] || 'Unknown',
    score: parseFloat(s.avg_score || 0),
  }))

  const companyAvg = data.length
    ? (data.reduce((s, x) => s + parseFloat(x.avg_score || 0), 0) / data.length).toFixed(2)
    : null
  const nfrAvg = data.length
    ? Math.round(data.reduce((s, x) => s + parseFloat(x.nfr_pct || 0), 0) / data.length)
    : 0

  return (
    <div>
      <div className="page-title">{profile?.role === 'supervisor' ? 'My Team Results' : 'Org Analytics'}</div>
      <div className="page-sub">Averaged scores only · Individual rater details never shown</div>

      <div className="flex items-center gap-3 mb-6">
        <label className="label mb-0 flex-shrink-0">Campaign:</label>
        <select className="input w-auto" value={selectedCampaign || ''}
          onChange={async e => { setSelectedCampaign(e.target.value); await loadScores(e.target.value) }}>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading analytics...</div>
      ) : data.length === 0 ? (
        <div className="card text-center py-12 text-gray-400 text-sm">No results available yet for this campaign</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="metric-card">
              <div className="text-xs text-gray-400 mb-1">Company avg score</div>
              <div className={`text-3xl font-bold ${parseFloat(companyAvg) > 0 ? 'text-brand-600' : 'text-red-500'}`}>
                {companyAvg ? (parseFloat(companyAvg) > 0 ? '+' : '') + parseFloat(companyAvg).toFixed(1) : '—'}
              </div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-gray-400 mb-1">Leaders rated</div>
              <div className="text-3xl font-bold text-gray-700">{data.length}</div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-gray-400 mb-1">Avg NFR declared</div>
              <div className="text-3xl font-bold text-green-600">{nfrAvg}%</div>
            </div>
          </div>

          <div className="card mb-6">
            <div className="sec-title">NFR scores by leader</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={[-3, 3]} tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={v => v > 0 ? `+${v}` : `${v}`} />
                <Tooltip formatter={v => [(v > 0 ? '+' : '') + v.toFixed(1), 'NFR Score']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}
                  fill="#185fa5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {trendData.length > 1 && (
            <div className="card mb-6">
              <div className="sec-title">Company NFR trend over time</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis domain={[-3, 3]} tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={v => v > 0 ? `+${v}` : `${v}`} />
                  <Tooltip formatter={v => [(v > 0 ? '+' : '') + v.toFixed(1), 'Avg Score']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine y={0} stroke="#e5e7eb" />
                  <Line type="monotone" dataKey="score" stroke="#185fa5" strokeWidth={2.5}
                    dot={{ fill: '#185fa5', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <div className="sec-title">Leader scoreboard</div>
            <table className="table-base">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Leader</th>
                  <th>Score</th>
                  <th>NFR %</th>
                  <th>Raters</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s, i) => {
                  const sc = parseFloat(s.avg_score)
                  const cls = sc > 0.5 ? 'score-pos' : sc < -0.5 ? 'score-neg' : 'score-zero'
                  return (
                    <tr key={s.id}>
                      <td className="font-bold text-brand-600">{i + 1}</td>
                      <td className="font-medium">{s.leader?.full_name}</td>
                      <td><span className={`score-pill ${cls}`}>{sc > 0 ? '+' : ''}{sc.toFixed(1)}</span></td>
                      <td className="text-gray-500">{Math.round(s.nfr_pct || 0)}%</td>
                      <td className="text-gray-400">{s.raters_submitted}/{s.raters_total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
