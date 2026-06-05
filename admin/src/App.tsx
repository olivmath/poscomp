import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Usuarios } from './pages/Usuarios'
import { Questoes } from './pages/Questoes'
import { Flags } from './pages/Flags'
import { Premium } from './pages/Premium'
import { Announcements } from './pages/Announcements'

const E2EAdminLogin = lazy(() => import('./pages/E2EAdminLogin').then(m => ({ default: m.E2EAdminLogin })))

function AdminRoutes() {
  const { user, isAdmin, loading } = useAuth()
  const [flagsBadge, setFlagsBadge] = useState(0)
  const [premiumBadge, setPremiumBadge] = useState(0)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--md-sys-color-outline-variant)', borderTopColor: 'var(--md-sys-color-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Carregando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--md-sys-color-error)', opacity: 0.6 }}>lock</span>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Acesso negado</h2>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
          Sua conta não possui claim <code>admin: true</code>.
        </p>
      </div>
    )
  }

  return (
    <Layout flagsBadge={flagsBadge} premiumBadge={premiumBadge}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/questoes" element={<Questoes />} />
        <Route path="/flags" element={<Flags onBadgeChange={setFlagsBadge} />} />
        <Route path="/premium" element={<Premium onBadgeChange={setPremiumBadge} />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            {(import.meta.env.DEV || import.meta.env.VITE_USE_EMULATOR === 'true') && (
              <Route path="/__e2e__/auth" element={<E2EAdminLogin />} />
            )}
            <Route path="/login" element={<LoginGuard />} />
            <Route path="/*" element={<AdminRoutes />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

function LoginGuard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Login />
}
