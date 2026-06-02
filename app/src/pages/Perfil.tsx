import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/switch/switch.js'
import '@material/web/icon/icon.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import type { PlanType } from '../types'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useNotifications } from '../hooks/useNotifications'
import { callDeleteAllData } from '../hooks/useFunctions'
import { ModalOverlay } from '../components/ModalOverlay'
import { PremiumFlowModal } from '../components/premium/PremiumFlowModal'
import { LegalModal } from '../components/LegalModal'

export function Perfil() {
  const { user, isPremium, premiumStatus, premiumExpiresAt, planType, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null)
  const { theme, toggleTheme } = useTheme()
  const { permission: notifPermission, enabled: notifEnabled, loading: notifLoading, toggle: toggleNotifications } = useNotifications()

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

  const renewalLabel = premiumExpiresAt
    ? `Renova em ${premiumExpiresAt.toLocaleDateString('pt-BR')}`
    : null

  const PLAN_LABELS: Record<PlanType, string> = {
    free: 'Plano Free',
    pro: 'Plano Pro',
    pro_max: 'Plano Pro MAX',
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
            <md-icon style={{ '--md-icon-size': 'var(--icon-size-2xl)' }}>person</md-icon>
          </div>
        )}
        <h1 className="perfil-name">{user?.displayName ?? 'Usuário'}</h1>
        <p className="perfil-email">{user?.email}</p>
      </div>

      {/* Assinatura */}
      <div className="perfil-section">
        <h2 className="perfil-section-title">Assinatura</h2>
        <md-list className="perfil-info-list">
          <md-list-item className="perfil-info-row">
            <md-icon slot="start">
              {isPremium ? 'workspace_premium' : 'person'}
            </md-icon>
            <span slot="headline">
              {profileLoading ? '...' : isPremium ? PLAN_LABELS[planType] : premiumStatus === 'pending' ? 'Aguardando aprovação' : 'Plano Free'}
            </span>
            {!profileLoading && renewalLabel && (
              <span slot="supporting-text">{renewalLabel}</span>
            )}
            {!profileLoading && premiumStatus === 'free' && (
              <md-outlined-button
                slot="end"
                onClick={() => setShowPremiumModal(true)}
              >
                Ver planos
              </md-outlined-button>
            )}
          </md-list-item>
        </md-list>
      </div>

      {/* Preferências */}
      <div className="perfil-section">
        <h2 className="perfil-section-title">Preferências</h2>
        <md-list className="perfil-info-list">
          <md-list-item
            type="button"
            onClick={toggleTheme}
            className="perfil-info-row"
          >
            <md-icon slot="start">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </md-icon>
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
          <md-list-item
            className="perfil-info-row"
            type="button"
            onClick={notifPermission !== 'denied' && notifPermission !== 'unsupported' ? toggleNotifications : undefined}
            disabled={notifLoading || notifPermission === 'denied' || notifPermission === 'unsupported'}
          >
            <md-icon slot="start">
              {notifEnabled ? 'notifications_active' : 'notifications_off'}
            </md-icon>
            <span slot="headline">Notificações</span>
            {notifPermission === 'denied' && (
              <span slot="supporting-text">Bloqueado no navegador</span>
            )}
            {notifPermission === 'unsupported' && (
              <span slot="supporting-text">Não suportado</span>
            )}
            <md-switch
              slot="end"
              selected={notifEnabled}
              disabled={notifLoading || notifPermission === 'denied' || notifPermission === 'unsupported'}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                if (notifPermission !== 'denied' && notifPermission !== 'unsupported') toggleNotifications()
              }}
              aria-label="Alternar notificações"
            />
          </md-list-item>
        </md-list>
      </div>

      {/* Sobre */}
      <div className="perfil-section">
        <h2 className="perfil-section-title">Sobre</h2>
        <md-list className="perfil-info-list">
          <md-list-item className="perfil-info-row">
            <md-icon slot="start">info</md-icon>
            <span slot="headline">Versão</span>
            <span slot="supporting-text">{`v${__APP_VERSION__}`}</span>
          </md-list-item>
          <md-list-item
            className="perfil-info-row"
            type="button"
            onClick={() => setShowLegal('privacy')}
          >
            <md-icon slot="start">policy</md-icon>
            <span slot="headline">Política de privacidade</span>
            <md-icon slot="end">chevron_right</md-icon>
          </md-list-item>
          <md-list-item
            className="perfil-info-row"
            type="button"
            onClick={() => setShowLegal('terms')}
          >
            <md-icon slot="start">gavel</md-icon>
            <span slot="headline">Termos de uso</span>
            <md-icon slot="end">chevron_right</md-icon>
          </md-list-item>
        </md-list>
      </div>

      {/* Conta */}
      <div className="perfil-section">
        <h2 className="perfil-section-title">Conta</h2>
        <md-list className="perfil-info-list">
          <md-list-item
            type="button"
            onClick={handleLogout}
            className="perfil-info-row perfil-logout-row"
          >
            <md-icon slot="start" className="perfil-logout-icon-list">logout</md-icon>
            <span slot="headline">{loggingOut ? 'Saindo...' : 'Sair da conta'}</span>
          </md-list-item>
        </md-list>
      </div>

      {/* Cuidado */}
      <div className="perfil-danger-zone">
        <div className="perfil-danger-zone__header">
          <md-icon className="perfil-danger-zone__icon">warning</md-icon>
          <span className="perfil-danger-zone__title">Cuidado</span>
        </div>
        <p className="perfil-danger-zone__desc">
          Remove permanentemente todo o histórico de simulados e cartões de revisão. Esta ação não pode ser desfeita.
        </p>
        <md-outlined-button
          onClick={() => setShowDeleteDialog(true)}
          style={{ '--md-outlined-button-outline-color': 'var(--md-sys-color-error)', '--md-outlined-button-label-text-color': 'var(--md-sys-color-error)' }}
        >
          <md-icon slot="icon">delete_forever</md-icon>
          Apagar todos os dados
        </md-outlined-button>
      </div>

      <PremiumFlowModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}

      {showDeleteDialog && (
        <ModalOverlay onBackdropClick={() => !deleting && setShowDeleteDialog(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <h2 id="delete-modal-title" className="modal-title">Apagar todos os dados?</h2>
            <p className="modal-body">
              Todo o histórico de simulados e cartões de revisão serão apagados permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <md-text-button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancelar
              </md-text-button>
              <md-filled-button
                onClick={handleDeleteAllData}
                disabled={deleting}
                style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)', '--md-filled-button-label-text-color': 'var(--md-sys-color-on-error)' }}
              >
                {deleting ? 'Apagando...' : 'Apagar tudo'}
              </md-filled-button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
