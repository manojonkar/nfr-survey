import { useEffect, useState } from 'react'
import { Mail, Bell, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const REMINDER_TYPES = [
  { key: 'invite',    label: 'Survey invite',        desc: 'Sent to all raters when campaign opens (Day 1)' },
  { key: 'reminder1', label: 'First reminder',       desc: 'Sent to pending raters on Day 3' },
  { key: 'reminder2', label: 'Urgent reminder',      desc: 'Sent to pending raters 24hrs before close' },
  { key: 'results',   label: 'Results notification', desc: 'Sent to leader, supervisor & HR when results are ready' },
]

export default function NotificationsPage() {
  const { company, profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [pendingRaters, setPendingRaters] = useState([])
  const [sending, setSending] = useState(false)
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (company?.id) load() }, [company])

  async function load() {
    setLoading(true)
    const [{ data: camp }, { data: notifs }] = await Promise.all([
      supabase.from('survey_campaigns').select('*').eq('company_id', company.id).eq('status', 'active').single(),
      supabase.from('notification_log').select('*, recipient:recipient_id(full_name, email)')
        .eq('company_id', company.id).order('sent_at', { ascending: false }).limit(50),
    ])
    setActiveCampaign(camp)
    setLogs(notifs || [])

    // Find raters who haven't submitted yet
    if (camp) {
      const { data: assignments } = await supabase.from('rater_assignments')
        .select('*, rater:rater_id(id, full_name, email)')
        .eq('company_id', company.id).eq('is_active', true)
      const { data: submitted } = await supabase.from('survey_responses')
        .select('rater_id').eq('campaign_id', camp.id).eq('company_id', company.id)
      const submittedIds = new Set((submitted || []).map(s => s.rater_id))
      const pending = (assignments || []).filter(a => !submittedIds.has(a.rater_id))
      setPendingRaters(pending)
    }
    setLoading(false)
  }

  async function sendReminder(type) {
    if (!activeCampaign) { toast.error('No active campaign'); return }
    setSending(true)

    const recipients = type === 'results'
      ? [] // would trigger results flow
      : pendingRaters

    if (recipients.length === 0 && type !== 'results') {
      toast.success('All raters have already submitted — no reminders needed!')
      setSending(false)
      return
    }

    // Log the notifications
    const logRows = recipients.map(r => ({
      company_id: company.id,
      recipient_id: r.rater?.id,
      type,
      channel: 'email',
      status: 'sent',
    }))

    if (logRows.length) {
      await supabase.from('notification_log').insert(logRows)
    }

    // In production: trigger email via SendGrid edge function
    // For now we simulate and show success
    await new Promise(r => setTimeout(r, 800))
    toast.success(`Reminders sent to ${recipients.length} pending raters`)
    setSending(false)
    load()
  }

  const statusColor = { sent: 'badge-green', failed: 'badge-red', pending: 'badge-amber' }
  const typeColor   = { invite: 'badge-blue', reminder1: 'badge-amber', reminder2: 'badge-red', results: 'badge-green' }

  return (
    <div>
      <div className="page-title">Notifications</div>
      <div className="page-sub">Send reminders and view notification history for your campaign</div>

      {/* Active campaign status */}
      {activeCampaign ? (
        <div className="card mb-6 border-brand-100 bg-brand-50/30">
          <div className="flex items-center gap-3 mb-3">
            <Bell size={16} className="text-brand-600" />
            <div className="font-medium">Active campaign: {activeCampaign.name}</div>
            <span className="badge badge-green">● Live</span>
          </div>
          <div className="text-sm text-gray-500 mb-4">
            <span className="font-medium text-amber-600">{pendingRaters.length} raters</span> have not yet submitted their surveys
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REMINDER_TYPES.filter(t => t.key !== 'results').map(t => (
              <div key={t.key} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="font-medium text-sm mb-0.5">{t.label}</div>
                <div className="text-xs text-gray-400 mb-3">{t.desc}</div>
                <button
                  onClick={() => sendReminder(t.key)}
                  disabled={sending || pendingRaters.length === 0}
                  className="btn btn-sm btn-primary w-full justify-center"
                >
                  <Send size={12} />
                  {sending ? 'Sending...' : `Send to ${pendingRaters.length} pending`}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card mb-6 text-center py-8 text-gray-400">
          <AlertCircle size={28} className="mx-auto mb-2 text-gray-300" />
          <div className="text-sm">No active campaign — notifications will be available when a campaign is running</div>
        </div>
      )}

      {/* Reminder schedule reference */}
      <div className="card mb-6">
        <div className="sec-title">Automatic reminder schedule</div>
        <div className="flex flex-col gap-3">
          {[
            { day: 'Day 1',  event: 'Campaign opens',           action: 'Invite sent to all assigned raters',              color: 'bg-brand-50 text-brand-700' },
            { day: 'Day 3',  event: 'First reminder',           action: 'Email to all raters who haven\'t submitted yet',  color: 'bg-amber-50 text-amber-700' },
            { day: 'Day 6',  event: 'Urgent reminder',          action: '24-hour warning to all pending raters',           color: 'bg-red-50 text-red-700' },
            { day: 'Day 7',  event: 'Campaign closes',          action: 'Results sent to leader, supervisor & HR Head',    color: 'bg-green-50 text-green-700' },
            { day: 'Day 10', event: 'If extended (+3 days)',    action: 'Additional reminders continue until new deadline', color: 'bg-purple-50 text-purple-700' },
          ].map(r => (
            <div key={r.day} className="flex items-start gap-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${r.color}`}>{r.day}</span>
              <div>
                <div className="text-sm font-medium text-gray-700">{r.event}</div>
                <div className="text-xs text-gray-400">{r.action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification log */}
      <div className="card">
        <div className="sec-title">Notification history</div>
        {loading ? (
          <div className="text-sm text-gray-400 py-4 text-center">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 text-center">No notifications sent yet</div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Sent at</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>
                    <div className="font-medium">{l.recipient?.full_name || '—'}</div>
                    <div className="text-xs text-gray-400">{l.recipient?.email}</div>
                  </td>
                  <td><span className={`badge ${typeColor[l.type] || 'badge-gray'} capitalize`}>{l.type}</span></td>
                  <td className="capitalize text-gray-500">{l.channel}</td>
                  <td>
                    <span className={`badge ${statusColor[l.status] || 'badge-gray'} capitalize`}>
                      {l.status === 'sent' ? <CheckCircle size={10} className="inline mr-1" /> : null}
                      {l.status}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">
                    {new Date(l.sent_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
