import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function Perfil() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'Avatar'}
            className="perfil-avatar"
          />
        ) : (
          <div className="perfil-avatar-placeholder">
            <span className="material-symbols-outlined md-icon--lg">person</span>
          </div>
        )}
        <h1 className="perfil-name">{user?.displayName ?? 'Usuário'}</h1>
        <p className="perfil-email">{user?.email}</p>
      </div>

      <div className="perfil-section">
        <h2 className="perfil-section-title">Aparência</h2>
        <div className="perfil-info-list" style={{ display: 'flex', padding: '16px', gap: '8px' }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: theme === t ? '2px solid #6750A4' : '1px solid #E7E0EC',
                background: theme === t ? '#E8DEF8' : '#F4EFF4',
                cursor: 'pointer',
                fontWeight: 600,
                color: theme === t ? '#6750A4' : '#49454F'
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="perfil-section">
        <h2 className="perfil-section-title">Conta</h2>
        <div className="perfil-info-list">
          <div className="perfil-info-row">
            <span className="material-symbols-outlined perfil-info-icon">badge</span>
            <div className="perfil-info-content">
              <span className="perfil-info-label">Nome</span>
              <span className="perfil-info-value">{user?.displayName ?? '—'}</span>
            </div>
          </div>
          <div className="perfil-info-row">
            <span className="material-symbols-outlined perfil-info-icon">mail</span>
            <div className="perfil-info-content">
              <span className="perfil-info-label">E-mail</span>
              <span className="perfil-info-value">{user?.email ?? '—'}</span>
            </div>
          </div>
          <div className="perfil-info-row">
            <span className="material-symbols-outlined perfil-info-icon">verified_user</span>
            <div className="perfil-info-content">
              <span className="perfil-info-label">Autenticação</span>
              <span className="perfil-info-value">Google</span>
            </div>
          </div>
        </div>
      </div>

      <div className="perfil-actions">
        <button
          className={`perfil-logout-btn ${loggingOut ? 'perfil-logout-btn--loading' : ''}`}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <span className="material-symbols-outlined perfil-logout-icon">logout</span>
          {loggingOut ? 'Saindo...' : 'Sair da conta'}
        </button>
      </div>
    </div>
  )
}
