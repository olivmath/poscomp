import { useLocation, useNavigate } from 'react-router-dom'
import { usePendingCount } from '../hooks/usePendingCount'

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const pendingCount = usePendingCount()

  const tabs = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/revisao', label: 'Revisão', icon: 'article', badge: pendingCount },
    { path: '/historico', label: 'Histórico', icon: 'history' },
    { path: '/perfil', label: 'Perfil', icon: 'person' },
  ]

  const active = tabs.findIndex((t) =>
    t.path === '/' ? location.pathname === '/' : location.pathname.startsWith(t.path)
  )

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--md-sys-color-surface-container)',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        zIndex: 100,
      }}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '8px 0 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: i === active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            position: 'relative',
          }}
          aria-label={tab.label}
          aria-current={i === active ? 'page' : undefined}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {tab.icon}
            </span>
            {tab.badge && tab.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  background: 'var(--md-sys-color-error)',
                  color: 'var(--md-sys-color-on-error)',
                  borderRadius: '50%',
                  fontSize: 10,
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </span>
          <span style={{ fontSize: 12 }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
