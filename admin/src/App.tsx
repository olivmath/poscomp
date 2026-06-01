import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { AdminLayout } from './components/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { QuestoesPage } from './pages/QuestoesPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { FlagsPage } from './pages/FlagsPage'
import { BannersPage } from './pages/BannersPage'
import { AdminsPage } from './pages/AdminsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/questoes" element={<QuestoesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/flags" element={<FlagsPage />} />
          <Route path="/banners" element={<BannersPage />} />
          <Route path="/admins" element={<AdminsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
