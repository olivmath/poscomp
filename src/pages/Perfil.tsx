import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/switch/switch.js'
import '@material/web/icon/icon.js'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { callDeleteAllData } from '../hooks/useFunctions'
import { ModalOverlay } from '../components/ModalOverlay'
import { PremiumFlowModal } from '../components/premium/PremiumFlowModal'

export function Perfil() {
  const { user, isPremium, premiumStatus, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
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
        <h2 className="perfil-section-title">Plano</h2>
        <md-list className="perfil-info-list">
          <md-list-item className="perfil-info-row">
            <span slot="start" className="material-symbols-outlined perfil-info-icon">
              {isPremium ? 'workspace_premium' : 'person'}
            </span>
            <span slot="headline">
              {profileLoading ? '...' : isPremium ? 'Premium' : premiumStatus === 'pending' ? 'Free' : 'Free'}
            </span>
            {!profileLoading && premiumStatus === 'pending' && (
              <span slot="supporting-text" style={{ color: 'var(--md-sys-color-tertiary)' }}>
                Aguardando aprovação
              </span>
            )}
            {!profileLoading && premiumStatus === 'free' && (
              <button
                slot="end"
                className="premium-upgrade-btn"
                onClick={() => setShowPremiumModal(true)}
              >
                Assinar R$ 10
              </button>
            )}
          </md-list-item>
        </md-list>
      </div>

      <div className="perfil-section">
        <h2 className="perfil-section-title">Conta</h2>
        <md-list className="perfil-info-list">
          <md-list-item className="perfil-info-row">
            <span slot="start" className="material-symbols-outlined perfil-info-icon">info</span>
            <span slot="headline">Versão</span>
            <span slot="supporting-text">{`v${__APP_VERSION__}`}</span>
          </md-list-item>

          <md-list-item
            type="button"
            onClick={handleLogout}
            className="perfil-info-row perfil-logout-row"
          >
            <span slot="start" className="material-symbols-outlined perfil-info-icon perfil-logout-icon-list">logout</span>
            <span slot="headline">{loggingOut ? 'Saindo...' : 'Sair da conta'}</span>
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


      <div className="perfil-danger-zone">
        <div className="perfil-danger-zone__header">
          <span className="material-symbols-outlined perfil-danger-zone__icon">warning</span>
          <span className="perfil-danger-zone__title">Cuidado</span>
        </div>
        <p className="perfil-danger-zone__desc">
          Remove permanentemente todo o histórico de simulados e cartões de revisão. Esta ação não pode ser desfeita.
        </p>
        <button
          className="perfil-danger-zone__btn"
          onClick={() => setShowDeleteDialog(true)}
        >
          <span className="material-symbols-outlined">delete_forever</span>
          Apagar todos os dados
        </button>
      </div>


      <PremiumFlowModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

      {showDeleteDialog && (
        <ModalOverlay onBackdropClick={() => !deleting && setShowDeleteDialog(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <h2 id="delete-modal-title" className="modal-title">Apagar todos os dados?</h2>
            <p className="modal-body">
              Todo o histórico de simulados e cartões de revisão serão apagados permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn--ghost"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="modal-btn modal-btn--danger"
                onClick={handleDeleteAllData}
                disabled={deleting}
              >
                {deleting ? 'Apagando...' : 'Apagar tudo'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
