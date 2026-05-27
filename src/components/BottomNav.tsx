import { useLocation, useNavigate } from 'react-router-dom'

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
    path: '/analises',
    label: 'Análises',
    icon: (active: boolean) => {
      const c = active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="4" y="14" width="4" height="6" rx="1"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
          />
          <rect
            x="10" y="9" width="4" height="11" rx="1"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
          />
          <rect
            x="16" y="4" width="4" height="16" rx="1"
            style={{ fill: active ? c : 'none', stroke: c }}
            strokeWidth="1.5"
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
            <span className="bottom-nav-icon">{tab.icon(active)}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
