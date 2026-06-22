import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppBar } from './components/AppBar'
import { BottomNav } from './components/BottomNav'
import { LeftSidebar } from './components/LeftSidebar'
import { useTheme } from './hooks/useTheme'
import { useIsMobile } from './hooks/useIsMobile'

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const E2ELogin = lazy(() => import('./pages/E2ELogin').then((m) => ({ default: m.E2ELogin })))
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const SimuladoConfig = lazy(() => import('./pages/SimuladoConfig').then((m) => ({ default: m.SimuladoConfig })))
const SimuladoRunning = lazy(() => import('./pages/SimuladoRunning').then((m) => ({ default: m.SimuladoRunning })))
const SimuladoResultado = lazy(() => import('./pages/SimuladoResultado').then((m) => ({ default: m.SimuladoResultado })))
const Revisao = lazy(() => import('./pages/Revisao').then((m) => ({ default: m.Revisao })))
const Historico = lazy(() => import('./pages/Historico').then((m) => ({ default: m.Historico })))
const HistoricoDetalhe = lazy(() => import('./pages/HistoricoDetalhe').then((m) => ({ default: m.HistoricoDetalhe })))
const Perfil = lazy(() => import('./pages/Perfil').then((m) => ({ default: m.Perfil })))

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 48, color: 'var(--md-sys-color-primary)', animation: 'spin 1s linear infinite' }}
      >
        progress_activity
      </span>
    </div>
  )
}

function PrivateRoutes() {
  const { user, loading } = useAuth()
  const isMobile = useIsMobile()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {!isMobile && <LeftSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        {isMobile && <BottomNav />}
      </div>
    </div>
  )
}

function PrivateRoutesBack() {
  const { user, loading } = useAuth()
  const isMobile = useIsMobile()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {!isMobile && <LeftSidebar />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}

function PrivateRoutesNoNav() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

function ThemeSync() {
  useTheme()
  return null
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeSync />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              {(import.meta.env.DEV || import.meta.env.VITE_USE_EMULATOR === 'true') && <Route path="/__e2e__/auth" element={<E2ELogin />} />}
            </Route>

            {/* Routes with BottomNav */}
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Home />} />
              <Route path="/revisao" element={<Revisao />} />
              <Route path="/historico" element={<Historico />} />
            </Route>

            {/* Sub-pages: back button + sidebar on desktop */}
            <Route element={<PrivateRoutesBack />}>
              <Route path="/simulado/resultado" element={<SimuladoResultado />} />
              <Route path="/historico/:id" element={<HistoricoDetalhe />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>

            {/* Immersive pages: no shell */}
            <Route element={<PrivateRoutesNoNav />}>
              <Route path="/simulado/config" element={<SimuladoConfig />} />
              <Route path="/simulado/running" element={<SimuladoRunning />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
