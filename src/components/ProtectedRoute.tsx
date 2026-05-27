import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--md-sys-color-surface)',
      }}>
        <md-circular-progress indeterminate />
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}
