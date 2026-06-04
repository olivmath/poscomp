import '@material/web/button/outlined-button.js'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { ReactNode } from 'react'

function SideNavItem({ to, icon, label, badge }: { to: string; icon: string; label: string; badge?: number }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <span className="material-symbols-outlined">{icon}</span>
      {label}
      {badge != null && badge > 0 && <span className="nav-badge">{badge}</span>}
    </NavLink>
  )
}

interface LayoutProps {
  children: ReactNode
  flagsBadge?: number
  premiumBadge?: number
}

export function Layout({ children, flagsBadge, premiumBadge }: LayoutProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">POSCOMP</div>
          <div className="sidebar-subtitle">Painel Admin</div>
        </div>
        <nav className="sidebar-nav">
          <SideNavItem to="/dashboard" icon="dashboard" label="Dashboard" />
          <SideNavItem to="/usuarios" icon="people" label="Usuários" />
          <SideNavItem to="/questoes" icon="quiz" label="Questões" />
          <SideNavItem to="/flags" icon="flag" label="Reports" badge={flagsBadge} />
          <SideNavItem to="/premium" icon="workspace_premium" label="Premium" badge={premiumBadge} />
          <SideNavItem to="/announcements" icon="campaign" label="Announcements" />
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="sidebar-user-avatar" />
              : <div className="sidebar-user-avatar-placeholder">{initials}</div>}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.displayName ?? 'Admin'}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <md-outlined-button onClick={async () => { await signOut(auth); navigate('/login') }} style={{ width: '100%' }}>
            <span className="material-symbols-outlined" slot="icon" style={{ fontSize: 16 }}>logout</span>
            Sair
          </md-outlined-button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
