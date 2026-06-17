import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

import LandingPage    from './pages/LandingPage'
import SignupPage     from './pages/SignupPage'
import LoginPage      from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardShell from './pages/DashboardShell'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }} />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/signup"    element={<SignupPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard/*" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
