import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/switch/switch.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/dialog/dialog.js'
import '@material/web/icon/icon.js'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { callDeleteAllData } from '../hooks/useFunctions'

export function Perfil() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    setLoggingOut(true)
    await signOut(auth)
    navigate('/login')
  }

  async function handleDeleteAllData() {
    setDeleting(true)
    try {
      await callDeleteAllData({})
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
    }
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
        <md-list className="perfil-info-list">
          <md-list-item className="perfil-info-row">
            <span slot="start" className="material-symbols-outlined perfil-info-icon">badge</span>
            <span slot="headline">Nome</span>
            <span slot="supporting-text">{user?.displayName ?? '—'}</span>
          </md-list-item>
          <md-list-item className="perfil-info-row">
            <span slot="start" className="material-symbols-outlined perfil-info-icon">mail</span>
            <span slot="headline">E-mail</span>
            <span slot="supporting-text">{user?.email ?? '—'}</span>
          </md-list-item>

          <md-list-item className="perfil-info-row">
            <span slot="start" className="material-symbols-outlined perfil-info-icon">info</span>
            <span slot="headline">Versão</span>
            <span slot="supporting-text">{`v${__APP_VERSION__}`}</span>
          </md-list-item>
        </md-list>
      </div>
            <div className="perfil-section">
        <h2 className="perfil-section-title">Preferências</h2>
        <md-list className="perfil-info-list">
          <md-list-item
            type="button"
            onClick={toggleTheme}
            className="perfil-info-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span slot="headline">Tema escuro</span>
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


      <div className="perfil-actions">
        <md-filled-tonal-button
          onClick={handleLogout}
          disabled={loggingOut}
          className="perfil-logout-md-btn"
        >
          <md-icon slot="icon">logout</md-icon>
          {loggingOut ? 'Saindo...' : 'Sair da conta'}
        </md-filled-tonal-button>

        <md-filled-tonal-button
          onClick={() => setShowDeleteDialog(true)}
          className="perfil-delete-md-btn"
        >
          <md-icon slot="icon">delete_forever</md-icon>
          Apagar todos os dados
        </md-filled-tonal-button>
      </div>

      {showDeleteDialog && (
        <md-dialog open onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div slot="headline">Apagar todos os dados?</div>
          <div slot="content">
            Todo o histórico de simulados e cartões de revisão serão apagados permanentemente. Esta ação não pode ser desfeita.
          </div>
          <div slot="actions">
            <md-text-button onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancelar
            </md-text-button>
            <md-filled-button onClick={handleDeleteAllData} disabled={deleting} className="perfil-delete-confirm-btn">
              {deleting ? 'Apagando...' : 'Apagar tudo'}
            </md-filled-button>
          </div>
        </md-dialog>
      )}
    </div>
  )
}
