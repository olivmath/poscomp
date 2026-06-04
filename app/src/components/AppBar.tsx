import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePendingCount } from '../hooks/usePendingCount'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/revisao', label: 'Revisão', icon: 'article' },
  { path: '/historico', label: 'Histórico', icon: 'history' },
]

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
  const pendingCount = usePendingCount()
  const [open, setOpen] = useState(false)

  function isActive(path: string) {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  }

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
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
        <button
          onClick={() => setOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--md-sys-color-on-surface)' }}
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

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
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--md-sys-color-on-surface)' }}
            />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>account_circle</span>
          )}
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              background: 'var(--md-sys-color-surface-container)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const badge = item.path === '/revisao' && pendingCount > 0 ? pendingCount : 0
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 8,
                    background: isActive(item.path)
                      ? 'var(--md-sys-color-primary-container)'
                      : 'none',
                    cursor: 'pointer',
                    color: isActive(item.path)
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-surface)',
                    textAlign: 'left',
                    fontSize: 15,
                    fontWeight: isActive(item.path) ? 600 : 400,
                    position: 'relative',
                  }}
                >
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span className="material-symbols-outlined">{item.icon}</span>
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
          </div>
        </div>
      )}
    </>
  )
}
