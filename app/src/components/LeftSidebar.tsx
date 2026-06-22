import { useLocation, useNavigate } from 'react-router-dom'
import { usePendingCount } from '../hooks/usePendingCount'
import { useIsMobile } from '../hooks/useIsMobile'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/revisao', label: 'Revisão', icon: 'article' },
  { path: '/historico', label: 'Histórico', icon: 'history' },
]

export function LeftSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const pendingCount = usePendingCount()
  const isMobile = useIsMobile()

  if (isMobile) return null

  function isActive(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  }

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        height: '100dvh',
        position: 'sticky',
        top: 0,
        background: 'var(--md-sys-color-surface-container)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: '12px 16px 20px',
          fontWeight: 700,
          fontSize: 18,
          color: 'var(--md-sys-color-primary)',
          letterSpacing: 0.5,
        }}
      >
        POSCOMP
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          const badge = item.path === '/revisao' && pendingCount > 0 ? pendingCount : 0
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                border: 'none',
                borderRadius: 8,
                background: active ? 'var(--md-sys-color-primary-container)' : 'none',
                cursor: 'pointer',
                color: active
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface)',
                textAlign: 'left',
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  {item.icon}
                </span>
                {badge > 0 && (
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
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
