import '@material/web/labs/navigationbar/navigation-bar.js'
import '@material/web/labs/navigationtab/navigation-tab.js'
import '@material/web/icon/icon.js'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSrs } from '../hooks/useSrs'

const TABS = [
  { path: '/',          label: 'Home',      icon: 'home'          },
  { path: '/revisao',   label: 'Revisão',   icon: 'article',      hasBadge: true },
  { path: '/historico', label: 'Histórico', icon: 'history'       },
  { path: '/perfil',    label: 'Perfil',    icon: 'person'        },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalPending } = useSrs()

  const activeIndex = getActiveIndex(location.pathname)

  return (
    <md-navigation-bar
      activeTabIndex={activeIndex}
      className="bottom-nav-bar"
      onNavigationTabActivated={(e: CustomEvent) => {
        const index = (e.target as HTMLElement).closest('md-navigation-bar')
          ? TABS.findIndex((_, i) => i === (e as CustomEvent & { detail: { tab: Element; tabIndex: number } }).detail.tabIndex)
          : -1
        if (index >= 0) navigate(TABS[index].path)
      }}
    >
      {TABS.map((tab) => (
        <md-navigation-tab
          key={tab.path}
          label={tab.label}
          aria-label={tab.label}
          data-testid={`nav-${tab.label.toLowerCase()}`}
          onClick={() => navigate(tab.path)}
        >
          <md-icon slot="active-icon">{tab.icon}</md-icon>
          <md-icon slot="inactive-icon">{tab.icon}</md-icon>
          {tab.hasBadge && totalPending > 0 && (
            <span slot="badge" className="bottom-nav-badge">
              {totalPending > 99 ? '99+' : totalPending}
            </span>
          )}
        </md-navigation-tab>
      ))}
    </md-navigation-bar>
  )
}

/// AUX FUNCTIONS

function getActiveIndex(pathname: string): number {
  if (pathname === '/') return 0
  const idx = TABS.findIndex((tab, i) => i > 0 && pathname.startsWith(tab.path))
  return idx >= 0 ? idx : 0
}
