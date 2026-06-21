import { useLocation, useNavigate } from 'react-router-dom'
import { useSrs } from '../hooks/useSrs'

const TABS = [
  { path: '/',          label: 'Home',      icon: 'home'             },
  { path: '/revisao',   label: 'Revisão',   icon: 'article', hasBadge: true },
  { path: '/historico', label: 'Histórico', icon: 'history'          },
  { path: '/perfil',    label: 'Perfil',    icon: 'person'           },
]

export function SideNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalPending } = useSrs()

  return (
    <nav className="side-nav" aria-label="Navegação principal">
      {TABS.map((tab) => {
        const active =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            className={`side-nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            data-testid={`sidenav-${tab.label.toLowerCase()}`}
          >
            <span className="side-nav-icon-wrap">
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.hasBadge && totalPending > 0 && (
                <span className="side-nav-badge">
                  {totalPending > 99 ? '99+' : totalPending}
                </span>
              )}
            </span>
            <span className="side-nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
