import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, Suspense, lazy, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
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

  useEffect(() => {
    if (!user || !isAdmin) return
    return onSnapshot(
      query(collection(db, 'flagged_questions'), where('resolved', '==', false)),
      (snap) => setFlagsBadge(snap.size)
    )
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || !isAdmin) return
    return onSnapshot(
      query(collection(db, 'premium_requests'), where('status', '==', 'pending')),
      (snap) => setPremiumBadge(snap.size)
    )
  }, [user, isAdmin])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--md-sys-color-outline-variant)', borderTopColor: 'var(--md-sys-color-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Carregando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!isAdmin) return <AccessDenied />

  return (
    <Layout flagsBadge={flagsBadge} premiumBadge={premiumBadge}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/questoes" element={<Questoes />} />
        <Route path="/flags" element={<Flags />} />
        <Route path="/premium" element={<Premium />} />
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

function AccessDenied() {
  const navigate = useNavigate()
  useEffect(() => {
    signOut(auth).then(() => {
      navigate('/login', { state: { error: 'Sua conta não possui permissão de administrador.' }, replace: true })
    })
  }, [navigate])
  return null
}

function LoginGuard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Login />
}
