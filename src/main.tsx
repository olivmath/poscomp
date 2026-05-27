import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ImmersiveModeProvider } from './contexts/ImmersiveModeContext'
import { ProtectedLayout } from './components/ProtectedLayout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Historico } from './pages/Historico'
import { Revisao } from './pages/Revisao'
import { Perfil } from './pages/Perfil'
import { Simulado } from './pages/Simulado'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ImmersiveModeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
          <Route path="/historico" element={<ProtectedLayout><Historico /></ProtectedLayout>} />
          <Route path="/revisao" element={<ProtectedLayout><Revisao /></ProtectedLayout>} />
          <Route path="/perfil" element={<ProtectedLayout><Perfil /></ProtectedLayout>} />
          <Route path="/simulado" element={<ProtectedLayout><Simulado /></ProtectedLayout>} />
        </Routes>
        </ImmersiveModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
