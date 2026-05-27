import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function Perfil() {
  const { user } = useAuth()
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
