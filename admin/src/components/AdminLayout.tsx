import '@material/web/icon/icon.js'
import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/questoes',  label: 'Questões',  icon: 'quiz' },
  { to: '/usuarios',  label: 'Usuários',  icon: 'group' },
  { to: '/tickets',   label: 'Tickets',   icon: 'confirmation_number' },
  { to: '/banners',   label: 'Banners',   icon: 'campaign' },
  { to: '/admins',    label: 'Admins',    icon: 'admin_panel_settings' },
]

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">POSCOMP</div>
          <div className="sidebar-logo-badge">admin console</div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <md-icon>{icon}</md-icon>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-signout" onClick={() => signOut(auth)}>
            <md-icon style={{ marginRight: '12px' }}>logout</md-icon>
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

