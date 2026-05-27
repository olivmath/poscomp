import { useLocation, useNavigate } from 'react-router-dom'
import { useSrs } from '../hooks/useSrs'

const TABS = [
  {
    path: '/',
    label: 'Home',
    icon: (active: boolean) => {
      const c = active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
  },
  {
    path: '/simulado',
    label: 'Simulado',
    icon: (active: boolean) => {
      const c = active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 3l14 9-14 9V3z"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
  },
  {
    path: '/revisao',
    label: 'Revisão',
    hasBadge: true,
    icon: (active: boolean) => {
      const c = active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
          />
        </svg>
      )
    },
  },
  {
    path: '/historico',
    label: 'Histórico',
    icon: (active: boolean) => {
      const c = active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" style={{ stroke: c }} strokeWidth="1.5" />
          <path
            d="M12 7v5l3.5 2"
            style={{ stroke: c }}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
  },
  {
    path: '/perfil',
    label: 'Perfil',
    icon: (active: boolean) => {
      const c = active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12" cy="8" r="4"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
          />
          <path
            d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
            style={{ stroke: c }}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    },
  },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalPending } = useSrs()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = isActive(tab.path)
        return (
          <button
            key={tab.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">
              {tab.icon(active)}
              {tab.hasBadge && totalPending > 0 && (
                <span className="bottom-nav-badge">
                  {totalPending > 99 ? '99+' : totalPending}
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
