import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PAGE_TITLES: { pattern: RegExp; label: string }[] = [
  { pattern: /^\/$/, label: 'Home' },
  { pattern: /^\/revisao/, label: 'Revisão' },
  { pattern: /^\/historico\//, label: 'Detalhe' },
  { pattern: /^\/historico/, label: 'Histórico' },
  { pattern: /^\/simulado\/config/, label: 'Novo Simulado' },
  { pattern: /^\/simulado\/running/, label: 'Simulado' },
  { pattern: /^\/simulado\/resultado/, label: 'Resultado' },
  { pattern: /^\/perfil/, label: 'Perfil' },
]

function getPageTitle(pathname: string): string {
  return PAGE_TITLES.find((p) => p.pattern.test(pathname))?.label ?? 'POSCOMP'
}

export function AppBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--md-sys-color-surface)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--md-sys-color-primary)' }}>
        {getPageTitle(location.pathname)}
      </span>

      <button
        onClick={() => navigate('/perfil')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="Perfil"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="Perfil"
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--md-sys-color-outline-variant)' }}
          />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>account_circle</span>
        )}
      </button>
    </div>
  )
}
