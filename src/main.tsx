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
import { ThemeProvider } from './contexts/ThemeContext'
// ...
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
// ...
          </Routes>
        </ThemeProvider>
      </AuthProvider>
// ...
    </BrowserRouter>
  </StrictMode>,
)
