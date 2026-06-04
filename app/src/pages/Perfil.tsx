import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, deleteUser } from 'firebase/auth'
import { doc, writeBatch, collection, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { PremiumFlowModal } from '../components/modals/PremiumFlowModal'
import { LegalModal } from '../components/modals/LegalModal'
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal'

const APP_VERSION = '1.0.0'

export function Perfil() {
  const navigate = useNavigate()
  const { user, userDoc } = useAuth()
  const { dark, toggle: toggleTheme } = useTheme()

  const [showPremium, setShowPremium] = useState(false)
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )

  const [versionTaps, setVersionTaps] = useState(0)
  const [devMode, setDevMode] = useState(() => localStorage.getItem('devMode') === 'true')
  const [debugLogs, setDebugLogs] = useState(() => localStorage.getItem('debugLogs') === 'true')

  async function handleToggleNotif() {
    if (notifPermission === 'denied') return
    if (notifPermission === 'granted') {
      setNotifPermission('default')
      return
    }
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      try {
        const fn = httpsCallable(functions, 'registerFcmToken')
        await fn({})
      } catch {
        // non-blocking
      }
    }
  }

  async function handleDeleteData() {
    if (!user) return
    setDeleting(true)
    try {
      const batch = writeBatch(db)
      const subCollections = ['results', 'srs_cards']
      for (const col of subCollections) {
        const snap = await getDocs(collection(db, 'users', user.uid, col))
        snap.docs.forEach((d) => batch.delete(d.ref))
      }
      batch.delete(doc(db, 'users', user.uid))
      await batch.commit()
      await deleteUser(user)
    } catch {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  function handleVersionTap() {
    const next = versionTaps + 1
    setVersionTaps(next)
    if (next >= 8) {
      setVersionTaps(0)
      const newMode = !devMode
      setDevMode(newMode)
      localStorage.setItem('devMode', String(newMode))
      if (window.__DEBUG__) console.log('Dev mode:', newMode)
    }
  }

  function toggleDebugLogs() {
    const next = !debugLogs
    setDebugLogs(next)
    localStorage.setItem('debugLogs', String(next))
    window.__DEBUG__ = next
  }

  function planLabel() {
    if (!userDoc) return '…'
    if (userDoc.premiumStatus === 'pending') return 'Aguardando aprovação'
    if (userDoc.planType === 'pro') return 'Plano Pro'
    if (userDoc.planType === 'pro_max') return 'Plano Pro MAX'
    return 'Plano Free'
  }

  function expiresLabel() {
    if (!userDoc?.premiumExpiresAt) return null
    return userDoc.premiumExpiresAt.toDate().toLocaleDateString('pt-BR')
  }

  const notifSupported = 'Notification' in window
  const notifBlocked = notifPermission === 'denied'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--md-sys-color-surface)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Perfil</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Avatar + info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Foto de perfil"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--md-sys-color-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--md-sys-color-on-primary-container)' }}>
                person
              </span>
            </div>
          )}
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{user?.displayName ?? 'Usuário'}</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>{user?.email}</p>
        </div>

        {/* Assinatura */}
        <SectionHeader label="Assinatura" icon="workspace_premium" />
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{planLabel()}</p>
              {expiresLabel() && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Renova em {expiresLabel()}
                </p>
              )}
            </div>
            {(!userDoc?.isPremium && userDoc?.premiumStatus !== 'pending') && (
              <button
                onClick={() => setShowPremium(true)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--md-sys-color-primary)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'var(--md-sys-color-on-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Ver planos
              </button>
            )}
          </div>
        </div>

        {/* Preferências */}
        <SectionHeader label="Preferências" icon="settings" />
        <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <PrefRow
            icon="dark_mode"
            label="Tema escuro"
            control={
              <Toggle checked={dark} onChange={toggleTheme} />
            }
          />
          <div style={{ height: 1, background: 'var(--md-sys-color-outline-variant)', margin: '0 -16px' }} />
          <PrefRow
            icon="notifications"
            label={
              <div>
                <span>Notificações</span>
                {notifBlocked && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--md-sys-color-error)' }}>Bloqueado no navegador</p>}
                {!notifSupported && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>Não suportado</p>}
              </div>
            }
            control={
              <Toggle
                checked={notifPermission === 'granted'}
                onChange={handleToggleNotif}
                disabled={notifBlocked || !notifSupported}
              />
            }
          />
        </div>

        {/* Sobre */}
        <SectionHeader label="Sobre" icon="info" />
        <div className="card" style={{ marginBottom: 16 }}>
          <PrefRow
            icon="info"
            label="Versão"
            control={
              <button
                onClick={handleVersionTap}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                v{APP_VERSION}
              </button>
            }
          />
          {devMode && (
            <>
              <div style={{ height: 1, background: 'var(--md-sys-color-outline-variant)', margin: '8px -16px' }} />
              <PrefRow
                icon="code"
                label="Debug logs"
                control={<Toggle checked={debugLogs} onChange={toggleDebugLogs} />}
              />
            </>
          )}
          <div style={{ height: 1, background: 'var(--md-sys-color-outline-variant)', margin: '8px -16px' }} />
          <PrefRow
            icon="policy"
            label="Política de Privacidade"
            control={
              <button onClick={() => setLegalType('privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.5 }}>chevron_right</span>
              </button>
            }
            onClick={() => setLegalType('privacy')}
          />
          <div style={{ height: 1, background: 'var(--md-sys-color-outline-variant)', margin: '8px -16px' }} />
          <PrefRow
            icon="gavel"
            label="Termos de Uso"
            control={
              <button onClick={() => setLegalType('terms')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.5 }}>chevron_right</span>
              </button>
            }
            onClick={() => setLegalType('terms')}
          />
        </div>

        {/* Conta */}
        <SectionHeader label="Conta" icon="manage_accounts" />
        <div className="card" style={{ marginBottom: 16 }}>
          <button
            onClick={() => signOut(auth)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              color: 'var(--md-sys-color-error)',
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            <span style={{ fontWeight: 600 }}>Sair da conta</span>
          </button>
        </div>

        {/* Danger zone */}
        <div
          className="card"
          style={{
            background: 'var(--md-sys-color-error-container)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-error)', fontSize: 20 }}>warning</span>
            <span style={{ fontWeight: 700, color: 'var(--md-sys-color-on-error-container)' }}>Cuidado</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--md-sys-color-on-error-container)' }}>
            Remove permanentemente todos os dados e encerra a conta.
          </p>
          <button
            onClick={() => setShowDelete(true)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid var(--md-sys-color-error)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--md-sys-color-error)',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Apagar todos os dados
          </button>
        </div>

      </div>

      {showPremium && <PremiumFlowModal onClose={() => setShowPremium(false)} />}
      {legalType && <LegalModal type={legalType} onClose={() => setLegalType(null)} />}
      {showDelete && (
        <ConfirmDeleteModal
          deleting={deleting}
          onConfirm={handleDeleteData}
          onCancel={() => !deleting && setShowDelete(false)}
        />
      )}
    </div>
  )
}

function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 8px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--md-sys-color-on-surface-variant)' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
    </div>
  )
}

function PrefRow({
  icon,
  label,
  control,
  onClick,
}: {
  icon: string
  label: React.ReactNode
  control: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant)' }}>{icon}</span>
      <div style={{ flex: 1, fontSize: 14 }}>{label}</div>
      {control}
    </div>
  )
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

declare global {
  interface Window { __DEBUG__: boolean }
}
