import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Historico } from './pages/Historico'
import { Analises } from './pages/Analises'
import { Perfil } from './pages/Perfil'
import { Simulado } from './pages/Simulado'
import './index.css'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
          <Route path="/historico" element={<ProtectedLayout><Historico /></ProtectedLayout>} />
          <Route path="/analises" element={<ProtectedLayout><Analises /></ProtectedLayout>} />
          <Route path="/perfil" element={<ProtectedLayout><Perfil /></ProtectedLayout>} />
          <Route path="/simulado" element={<ProtectedLayout><Simulado /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
