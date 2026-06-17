// SurveyPage.jsx
import { useEffect, useState } from 'react'
import { CheckCircle, Info } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const QUESTIONS = [
  { id: 'q1', text: 'Did this person communicate proactively this month — giving updates before you needed to ask?', hint: 'Think about status updates, flagging blockers early, keeping you in the loop.' },
  { id: 'q2', text: 'Did this person deliver on their commitments on time this month without needing reminders?', hint: 'Consider how often deadlines were met as promised.' },
  { id: 'q3', text: 'When delays were unavoidable this month, did this person inform you well in advance?', hint: 'High score = flagged delays early. Low score = you found out at or after the deadline.' },
  { id: 'q4', text: 'How reliably did this person follow through on promises and commitments made this month?', hint: 'Covers both formal SLAs and informal promises.' },
  { id: 'q5', text: 'How responsive was this person to your queries, requests or escalations this month?', hint: 'Consider typical response time and acknowledgements.' },
]
const SCALE = [-3,-2,-1,0,1,2,3]
const SCALE_LABELS = ['Critical gap','Needs work','Below avg','Neutral','Good','Very good','Excellent']

export default function SurveyPage() {
  const { profile, company } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState({})
  const [nfr, setNfr] = useState(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [campaign, setCampaign] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile?.id || !company?.id) return
    loadAssignments()
  }, [profile, company])

  async function loadAssignments() {
    const { data: camp } = await supabase.from('survey_campaigns').select('*')
      .eq('company_id', company.id).eq('status', 'active').single()
    setCampaign(camp)
    if (!camp) return
    const { data } = await supabase.from('rater_assignments')
      .select('*, leader:leader_id(id, full_name, email)')
      .eq('rater_id', profile.id).eq('is_active', true)
    // Filter out already-submitted
    const pending = []
    for (const a of (data || [])) {
      const { data: resp } = await supabase.from('survey_responses')
        .select('id').eq('campaign_id', camp.id).eq('leader_id', a.leader_id).eq('rater_id', profile.id).single()
      if (!resp) pending.push(a)
    }
    setAssignments(pending)
  }

  function setAnswer(qId, val) { setAnswers(prev => ({ ...prev, [qId]: val })) }

  async function handleSubmit() {
    if (Object.keys(answers).length < QUESTIONS.length) { toast.error('Please answer all questions'); return }
    if (nfr === null) { toast.error('Please make the NFR declaration'); return }
    setSaving(true)
    const { error } = await supabase.from('survey_responses').insert({
      campaign_id: campaign.id, leader_id: selected.leader_id,
      rater_id: profile.id, rater_role: selected.rater_role,
      company_id: company.id,
      q1_score: answers.q1, q2_score: answers.q2, q3_score: answers.q3,
      q4_score: answers.q4, q5_score: answers.q5,
      nfr_declared: nfr, comment,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setSubmitted(true)
    setAssignments(a => a.filter(x => x.leader_id !== selected.leader_id))
  }

  if (!campaign) return (
    <div className="card text-center py-12 text-gray-400">
      <Info size={28} className="mx-auto mb-2 text-gray-300" />
      <div className="text-sm font-medium">No active survey campaign right now</div>
      <div className="text-xs mt-1">Surveys open on the 1st of each month</div>
    </div>
  )

  if (submitted) return (
    <div className="card text-center py-12">
      <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
      <div className="text-lg font-semibold mb-2">Survey submitted!</div>
      <div className="text-sm text-gray-400 mb-6">Your feedback for <strong>{selected?.leader?.full_name}</strong> has been recorded anonymously.</div>
      {assignments.length > 0 ? (
        <button className="btn btn-primary mx-auto" onClick={() => { setSubmitted(false); setSelected(null); setAnswers({}); setNfr(null); setComment('') }}>
          Rate another person ({assignments.length} remaining)
        </button>
      ) : (
        <div className="text-sm text-green-600 font-medium">✓ All surveys complete for this month!</div>
      )}
    </div>
  )

  if (!selected) return (
    <div>
      <div className="page-title">Rate Someone</div>
      <div className="page-sub">Campaign: {campaign.name} · Select a leader to rate</div>
      {assignments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
          <div className="text-sm font-medium text-green-600">All your surveys are complete for {campaign.name}!</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map(a => (
            <div key={a.leader_id} onClick={() => setSelected(a)}
              className="card hover:border-brand-200 cursor-pointer transition-all flex items-center gap-4">
              <div className="avatar-lg">{a.leader?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div className="flex-1">
                <div className="font-semibold">{a.leader?.full_name}</div>
                <div className="text-sm text-gray-400">Your role: {a.rater_role}</div>
              </div>
              <span className="badge badge-blue">Rate →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const allAnswered = Object.keys(answers).length === QUESTIONS.length

  return (
    <div>
      <div className="page-title">Rating: {selected.leader?.full_name}</div>
      <div className="page-sub">Your role: <strong>{selected.rater_role}</strong> · Your name is never shown — only your role.</div>

      <div className="card mb-4">
        <div className="flex justify-between text-[10px] text-gray-400 mb-2 px-0.5">
          {SCALE_LABELS.map((l,i) => <span key={i} className="flex-1 text-center">{l}</span>)}
        </div>
        {QUESTIONS.map((q, qi) => (
          <div key={q.id} className={qi > 0 ? 'border-t border-gray-100 pt-4 mt-4' : ''}>
            <div className="text-sm font-medium mb-1">{q.text}</div>
            <div className="flex items-start gap-1 mb-3">
              <Info size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-400">{q.hint}</div>
            </div>
            <div className="flex gap-1.5">
              {SCALE.map(v => {
                const sel = answers[q.id] === v
                const cls = sel
                  ? v < 0 ? 'scale-sel-neg' : v > 0 ? 'scale-sel-pos' : 'scale-sel-zero'
                  : v < 0 ? 'scale-neg' : v > 0 ? 'scale-pos' : 'scale-zero'
                return (
                  <button key={v} className={`scale-btn ${cls}`} onClick={() => setAnswer(q.id, v)}>
                    {v > 0 ? `+${v}` : v}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="text-sm font-semibold mb-4">Overall NFR declaration for {campaign.name}</div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setNfr(true)} className={`p-4 rounded-xl border-2 text-left transition-all ${nfr === true ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
            <div className="text-xl mb-1">✅</div>
            <div className="font-semibold text-green-800 text-sm">NFR — No follow-up needed</div>
            <div className="text-xs text-green-600 mt-1">Work done on time. Delays flagged in advance.</div>
          </button>
          <button onClick={() => setNfr(false)} className={`p-4 rounded-xl border-2 text-left transition-all ${nfr === false ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}>
            <div className="text-xl mb-1">🔁</div>
            <div className="font-semibold text-red-800 text-sm">Follow-up required</div>
            <div className="text-xs text-red-600 mt-1">I had to chase or remind to get outcomes.</div>
          </button>
        </div>
        <div className="mt-4">
          <label className="label">Optional comment (shown with your role, not name)</label>
          <textarea className="input min-h-20 resize-y" placeholder="Specific examples help the person grow..."
            value={comment} onChange={e => setComment(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn" onClick={() => setSelected(null)}>← Back</button>
        <button className="btn btn-primary flex-1 justify-center"
          onClick={handleSubmit} disabled={!allAnswered || nfr === null || saving}>
          {saving ? 'Submitting...' : 'Submit survey'}
        </button>
      </div>
    </div>
  )
}
