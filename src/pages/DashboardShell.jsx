import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, BarChart2, Settings, LogOut, Bell, FileText, UserCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

// Pages
import AdminDashboard   from './dashboard/AdminDashboard'
import ManageUsers      from './dashboard/ManageUsers'
import ManageCampaigns  from './dashboard/ManageCampaigns'
import SurveyPage       from './dashboard/SurveyPage'
import ResultsPage      from './dashboard/ResultsPage'
import AnalyticsPage    from './dashboard/AnalyticsPage'
import NotificationsPage from './dashboard/NotificationsPage'

const NAV = {
  company_admin: [
    { to: '', icon: LayoutDashboard, label: 'Dashboard' },
    { to: 'users',       icon: Users,         label: 'People' },
    { to: 'campaigns',   icon: Calendar2,     label: 'Campaigns' },
    { to: 'analytics',   icon: BarChart2,     label: 'Analytics' },
    { to: 'notifications', icon: Bell,        label: 'Notifications' },
  ],
  hr_head: [
    { to: '', icon: LayoutDashboard, label: 'Dashboard' },
    { to: 'analytics',   icon: BarChart2,     label: 'All Results' },
    { to: 'notifications', icon: Bell,        label: 'Notifications' },
  ],
  supervisor: [
    { to: '', icon: LayoutDashboard, label: 'Dashboard' },
    { to: 'results',     icon: FileText,      label: 'My Results' },
    { to: 'analytics',   icon: BarChart2,     label: 'My Team' },
  ],
  leader: [
    { to: '', icon: LayoutDashboard, label: 'Dashboard' },
    { to: 'results',     icon: FileText,      label: 'My Results' },
  ],
  rater: [
    { to: 'survey',     icon: ClipboardList,  label: 'Rate Someone' },
  ],
}

// Placeholder Calendar2 icon
function Calendar2(props) {
  return <ClipboardList {...props} />
}

export default function DashboardShell() {
  const { profile, company, signOut } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || 'rater'
  const navItems = NAV[role] || NAV['rater']

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{company?.name || 'NFRCompany'}</div>
              <div className="text-[10px] text-gray-400 truncate">{company?.slug}.nfrcompany.com</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={`/dashboard/${item.to}`}
                end={item.to === ''}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="avatar">{initials}</div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate">{profile?.full_name}</div>
              <div className="text-[10px] text-gray-400 capitalize">{role.replace('_', ' ')}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="sidebar-link w-full text-red-400 hover:bg-red-50 hover:text-red-600">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Trial banner */}
        {company?.plan === 'trial' && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-xs text-amber-700 flex items-center justify-between">
            <span>🎉 Free trial — expires {new Date(company?.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <button className="font-medium underline">Upgrade plan</button>
          </div>
        )}

        <div className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route index                  element={<AdminDashboard />} />
            <Route path="users"           element={<ManageUsers />} />
            <Route path="campaigns"       element={<ManageCampaigns />} />
            <Route path="survey"          element={<SurveyPage />} />
            <Route path="results"         element={<ResultsPage />} />
            <Route path="analytics"       element={<AnalyticsPage />} />
            <Route path="notifications"   element={<NotificationsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
