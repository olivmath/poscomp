import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/questoes',  label: 'Questões'  },
  { to: '/usuarios',  label: 'Usuários'  },
  { to: '/tickets',   label: 'Tickets'   },
  { to: '/banners',   label: 'Banners'   },
  { to: '/admins',    label: 'Admins'    },
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
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-signout" onClick={() => signOut(auth)}>
            ← Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
