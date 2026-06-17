import { useEffect, useState } from 'react'
import { Plus, Upload, Search, Trash2, Edit2, UserCheck, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Papa from 'papaparse'

const ROLES = ['leader', 'rater', 'supervisor', 'hr_head', 'company_admin']
const RATER_ROLES = ['Supervisor','Team member','Peer','Internal client','Cross-functional colleague','Senior stakeholder','External client']

export default function ManageUsers() {
  const { company } = useAuth()
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('leader')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [showRaterModal, setShowRaterModal] = useState(null) // leader to assign raters for
  const [allUsers, setAllUsers] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'leader' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (company?.id) loadUsers() }, [company, filter])

  async function loadUsers() {
    const { data } = await supabase.from('users').select('*')
      .eq('company_id', company.id).eq('role', filter).eq('is_active', true).order('full_name')
    setUsers(data || [])
    const { data: all } = await supabase.from('users').select('*').eq('company_id', company.id).eq('is_active', true)
    setAllUsers(all || [])
  }

  async function saveUser(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, company_id: company.id }
    let error
    if (editUser) {
      ({ error } = await supabase.from('users').update(payload).eq('id', editUser.id))
    } else {
      ({ error } = await supabase.from('users').upsert(payload, { onConflict: 'company_id,email' }))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editUser ? 'User updated' : 'User added')
    setShowForm(false); setEditUser(null); setForm({ full_name: '', email: '', phone: '', role: 'leader' })
    loadUsers()
  }

  async function deactivate(id) {
    if (!confirm('Remove this person?')) return
    await supabase.from('users').update({ is_active: false }).eq('id', id)
    toast.success('Removed'); loadUsers()
  }

  function startEdit(u) {
    setForm({ full_name: u.full_name, email: u.email, phone: u.phone || '', role: u.role })
    setEditUser(u); setShowForm(true)
  }

  async function handleCSV(e) {
    const file = e.target.files[0]
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async ({ data }) => {
        const rows = data.map(r => ({
          company_id: company.id,
          full_name: r.name || r.Name || r.full_name || '',
          email: (r.email || r.Email || '').toLowerCase(),
          phone: r.phone || r.Phone || '',
          role: filter,
        })).filter(r => r.full_name && r.email)
        const { error } = await supabase.from('users').upsert(rows, { onConflict: 'company_id,email' })
        if (error) { toast.error(error.message); return }
        toast.success(`${rows.length} people imported`); loadUsers()
      }
    })
    e.target.value = ''
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const initials = n => n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div>
      <div className="page-title">People Management</div>
      <div className="page-sub">Manage leaders, raters, supervisors and HR across your organisation</div>

      {/* Role tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {ROLES.map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`nav-tab capitalize ${filter === r ? 'active' : ''}`}>
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder={`Search ${filter}s...`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <label className="btn btn-sm cursor-pointer">
          <Upload size={13} /> Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        </label>
        <button className="btn btn-sm btn-primary" onClick={() => { setShowForm(true); setEditUser(null); setForm({ full_name: '', email: '', phone: '', role: filter }) }}>
          <Plus size={13} /> Add {filter.replace('_', ' ')}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card mb-5 border-brand-100 bg-brand-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium text-sm">{editUser ? 'Edit person' : `Add ${filter.replace('_', ' ')}`}</div>
            <button onClick={() => { setShowForm(false); setEditUser(null) }}><X size={16} className="text-gray-400" /></button>
          </div>
          <form onSubmit={saveUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Full name *</label>
              <input className="input" placeholder="Priya Sharma" required
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="priya@co.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 98765 43210"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4 flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving...' : editUser ? 'Update' : 'Add person'}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => { setShowForm(false); setEditUser(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th className="pl-4">Name</th>
              <th>Email</th>
              <th>Phone</th>
              {filter === 'leader' && <th>Raters</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">No {filter}s found. Add one above.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td className="pl-4">
                  <div className="flex items-center gap-2">
                    <div className="avatar">{initials(u.full_name)}</div>
                    <span className="font-medium">{u.full_name}</span>
                  </div>
                </td>
                <td className="text-gray-500">{u.email}</td>
                <td className="text-gray-400">{u.phone || '—'}</td>
                {filter === 'leader' && (
                  <td>
                    <button className="btn btn-sm" onClick={() => setShowRaterModal(u)}>
                      <UserCheck size={12} /> Assign raters
                    </button>
                  </td>
                )}
                <td>
                  <div className="flex gap-1 justify-end pr-2">
                    <button className="btn btn-sm" onClick={() => startEdit(u)}><Edit2 size={12} /></button>
                    <button className="btn btn-sm text-red-400 border-red-100 hover:bg-red-50" onClick={() => deactivate(u.id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-400 mt-2">{filtered.length} {filter}s</div>

      {/* Rater assignment modal */}
      {showRaterModal && (
        <RaterModal leader={showRaterModal} allUsers={allUsers} companyId={company.id}
          onClose={() => setShowRaterModal(null)} />
      )}
    </div>
  )
}

function RaterModal({ leader, allUsers, companyId, onClose }) {
  const [assignments, setAssignments] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('rater_assignments').select('*').eq('leader_id', leader.id).eq('is_active', true)
      .then(({ data }) => setAssignments(data || []))
  }, [leader.id])

  const raters = allUsers.filter(u => u.id !== leader.id)
  const assignedIds = assignments.map(a => a.rater_id)

  async function toggle(user, role) {
    const existing = assignments.find(a => a.rater_id === user.id)
    if (existing) {
      await supabase.from('rater_assignments').update({ is_active: false }).eq('id', existing.id)
      setAssignments(a => a.filter(x => x.rater_id !== user.id))
    } else {
      if (assignments.length >= 10) { toast.error('Maximum 10 raters per leader'); return }
      const { data } = await supabase.from('rater_assignments').insert({
        company_id: companyId, leader_id: leader.id, rater_id: user.id, rater_role: role
      }).select().single()
      if (data) setAssignments(a => [...a, data])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <div className="font-semibold">Assign raters for {leader.full_name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{assignments.length}/10 raters assigned</div>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {RATER_ROLES.map(roleLabel => (
            <div key={roleLabel} className="mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{roleLabel}</div>
              <div className="flex flex-col gap-1">
                {raters.map(u => {
                  const isAssigned = assignedIds.includes(u.id)
                  const thisAssignment = assignments.find(a => a.rater_id === u.id)
                  const isThisRole = thisAssignment?.rater_role === roleLabel
                  if (thisAssignment && !isThisRole) return null
                  return (
                    <div key={u.id} onClick={() => toggle(u, roleLabel)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isAssigned && isThisRole ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {u.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.full_name}</div>
                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                      </div>
                      {isAssigned && isThisRole && <span className="text-brand-600 text-xs font-medium">✓ Selected</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button className="btn btn-primary w-full justify-center" onClick={onClose}>
            Done — {assignments.length} raters assigned
          </button>
        </div>
      </div>
    </div>
  )
}
