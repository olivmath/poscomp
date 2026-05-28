import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/switch/switch.js'
import '@material/web/button/filled-tonal-button.js'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'

export function Perfil() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const { theme, toggleTheme } = useTheme()

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
        <h2 className="perfil-section-title">Preferências</h2>
        <md-list className="perfil-info-list">
          <md-list-item
            headline="Tema escuro"
            type="button"
            onClick={toggleTheme}
            className="perfil-info-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <md-switch
              slot="end"
              selected={theme === 'dark'}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                toggleTheme()
              }}
              aria-label="Alternar tema escuro"
            />
          </md-list-item>
        </md-list>
      </div>

      <div className="perfil-section">
        <h2 className="perfil-section-title">Conta</h2>
        <md-list className="perfil-info-list">
          <md-list-item
            headline="Nome"
            supporting-text={user?.displayName ?? '—'}
            className="perfil-info-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon">badge</span>
          </md-list-item>
          <md-list-item
            headline="E-mail"
            supporting-text={user?.email ?? '—'}
            className="perfil-info-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon">mail</span>
          </md-list-item>
          <md-list-item
            headline="Autenticação"
            supporting-text="Google"
            className="perfil-info-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon">verified_user</span>
          </md-list-item>
          <md-list-item
            headline="Versão"
            supporting-text={`v${__APP_VERSION__}`}
            className="perfil-info-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon">info</span>
          </md-list-item>
        </md-list>
      </div>

      <div className="perfil-actions">
        <md-filled-tonal-button
          onClick={handleLogout}
          disabled={loggingOut}
          className="perfil-logout-md-btn"
        >
          <span slot="icon" className="material-symbols-outlined">logout</span>
          {loggingOut ? 'Saindo...' : 'Sair da conta'}
        </md-filled-tonal-button>
      </div>
    </div>
  )
}
