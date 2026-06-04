import '@material/web/progress/circular-progress.js'
import '@material/web/button/filled-button.js'
import '@material/web/menu/menu.js'
import '@material/web/menu/menu-item.js'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { AdminUser } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface ListUsersResponse {
  users: AdminUser[]
  pageToken?: string
}

interface Confirm {
  title: string
  body: string
  danger?: boolean
  confirmLabel?: string
  onConfirm: () => void
}

function PlanBadge({ plan, expiresAt, isPremium }: { plan: AdminUser['planType']; expiresAt?: AdminUser['premiumExpiresAt']; isPremium: boolean }) {
  if (!isPremium || plan === 'free') return <span className="badge badge-free">Free</span>
  const exp = expiresAt
    ? typeof expiresAt === 'string'
      ? new Date(expiresAt)
      : (expiresAt as { toDate(): Date }).toDate()
    : null
  const expired = exp ? exp < new Date() : false
  if (expired) return <span className="badge badge-expired">EXPIRADO</span>
  return <span className={`badge badge-${plan}`}>{plan === 'pro_max' ? 'Pro MAX' : 'Pro'}</span>
}

export function Usuarios() {
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter')

  const [users, setUsers] = useState<AdminUser[]>([])
  const [pageToken, setPageToken] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [menuState, setMenuState] = useState<{ uid: string; rect: DOMRect } | null>(null)

  const load = useCallback(async (token?: string) => {
    if (token) setLoadingMore(true); else setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<{ pageToken?: string }, ListUsersResponse>(functions, 'listUsers')
      const res = await fn({ pageToken: token })
      if (token) setUsers(u => [...u, ...res.data.users])
      else setUsers(res.data.users)
      setPageToken(res.data.pageToken)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function callFn(name: string, payload: Record<string, unknown>, onSuccess: () => void) {
    return async () => {
      try {
        const fn = httpsCallable(functions, name)
        await fn(payload)
        onSuccess()
        setConfirm(null)
        setMenuState(null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : `Erro em ${name}`)
        setConfirm(null)
      }
    }
  }

  function toggleDisable(u: AdminUser) {
    if (u.disabled) {
      callFn('enableUser', { uid: u.uid }, () => setUsers(us => us.map(x => x.uid === u.uid ? { ...x, disabled: false } : x)))()
    } else {
      setConfirm({
        title: 'Desabilitar conta',
        body: `Desabilitar ${u.email}? O usuário não conseguirá fazer login.`,
        danger: true,
        onConfirm: callFn('disableUser', { uid: u.uid }, () => setUsers(us => us.map(x => x.uid === u.uid ? { ...x, disabled: true } : x))),
      })
    }
  }

  function grantAdmin(u: AdminUser) {
    setConfirm({
      title: 'Conceder admin',
      body: `Conceder claim admin para ${u.email}?`,
      onConfirm: callFn('setAdminRole', { uid: u.uid }, () => setUsers(us => us.map(x => x.uid === u.uid ? { ...x, isAdmin: true } : x))),
    })
  }

  function revokeAdmin(u: AdminUser) {
    setConfirm({
      title: 'Revogar admin',
      body: `Revogar claim admin de ${u.email}?`,
      danger: true,
      onConfirm: callFn('revokeAdminRole', { uid: u.uid }, () => setUsers(us => us.map(x => x.uid === u.uid ? { ...x, isAdmin: false } : x))),
    })
  }

  function resetSrs(u: AdminUser) {
    setConfirm({
      title: 'Resetar SRS',
      body: `Deletar TODOS os cards SRS de ${u.email}? Ação irreversível.`,
      danger: true,
      confirmLabel: 'Deletar tudo',
      onConfirm: callFn('resetUserSrs', { uid: u.uid }, () => null),
    } as Confirm)
  }

  function grantPremium(u: AdminUser, planType: 'pro' | 'pro_max') {
    const label = planType === 'pro' ? 'Pro (30 dias)' : 'Pro MAX (1 ano)'
    setConfirm({
      title: `Conceder ${label}`,
      body: `Conceder ${label} para ${u.email} sem comprovante?`,
      onConfirm: callFn('grantPremiumAdmin', { uid: u.uid, planType }, () => setUsers(us => us.map(x => x.uid === u.uid ? { ...x, isPremium: true, planType } : x))),
    })
  }

  let displayed = users
  if (search) {
    const q = search.toLowerCase()
    displayed = users.filter(u => u.email.toLowerCase().includes(q) || u.uid.includes(q))
  }
  if (filter === 'expiring7') displayed = displayed.filter(u => {
    const exp = u.premiumExpiresAt ? (typeof u.premiumExpiresAt === 'string' ? new Date(u.premiumExpiresAt) : (u.premiumExpiresAt as { toDate(): Date }).toDate()) : null
    return exp && exp > new Date() && exp <= new Date(Date.now() + 7 * 86400000)
  })
  if (filter === 'expiring30') displayed = displayed.filter(u => {
    const exp = u.premiumExpiresAt ? (typeof u.premiumExpiresAt === 'string' ? new Date(u.premiumExpiresAt) : (u.premiumExpiresAt as { toDate(): Date }).toDate()) : null
    return exp && exp > new Date() && exp <= new Date(Date.now() + 30 * 86400000)
  })
  if (filter === 'expired') displayed = displayed.filter(u => !u.isPremium && u.premiumExpiresAt)

  function ActionsMenu({ anchorRect, user, onClose }: { anchorRect: DOMRect; user: AdminUser; onClose: () => void }) {
    const ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      function handleOutside(e: MouseEvent) {
        if (!ref.current) return
        if (!ref.current.contains(e.target as Node)) onClose()
      }
      function handleScroll() { onClose() }
      document.addEventListener('mousedown', handleOutside)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
      return () => {
        document.removeEventListener('mousedown', handleOutside)
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleScroll)
      }
    }, [onClose])

    const style: React.CSSProperties = {
      position: 'absolute',
      left: anchorRect.left + window.scrollX,
      top: anchorRect.bottom + window.scrollY,
      minWidth: 160,
      background: 'var(--md-sys-color-surface)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      zIndex: 1200,
      padding: 6,
    }

    const itemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }
    const divider = <div style={{ height: 1, background: 'var(--md-sys-color-outline-variant)', margin: '6px 0' }} />

    return createPortal(
      <div ref={ref} style={style}>
        <button style={{ ...itemStyle, color: user.disabled ? 'var(--color-score-high)' : 'var(--color-score-low)' }} onClick={() => { onClose(); toggleDisable(user) }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{user.disabled ? 'person_check' : 'person_off'}</span>
          {user.disabled ? 'Habilitar conta' : 'Desabilitar conta'}
        </button>

        <button style={{ ...itemStyle, color: user.isAdmin ? 'var(--color-score-low)' : 'inherit' }} onClick={() => { onClose(); user.isAdmin ? revokeAdmin(user) : grantAdmin(user) }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{user.isAdmin ? 'remove_moderator' : 'admin_panel_settings'}</span>
          {user.isAdmin ? 'Revogar Admin' : 'Conceder Admin'}
        </button>

        {divider}

        <button style={itemStyle} onClick={() => { onClose(); grantPremium(user, 'pro') }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>workspace_premium</span>
          Conceder Pro (30d)
        </button>

        <button style={itemStyle} onClick={() => { onClose(); grantPremium(user, 'pro_max') }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>stars</span>
          Conceder Pro MAX (1a)
        </button>

        {divider}

        <button style={{ ...itemStyle, color: 'var(--color-score-low)' }} onClick={() => { onClose(); resetSrs(user) }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
          Resetar SRS
        </button>
      </div>,
      document.body
    )
  }

  return (
    <>
      <div className="page-header"><h1 className="page-title">Usuários</h1></div>
      {error && (
        <div className="error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      <div className="toolbar">
        <input
          className="input input-search"
          placeholder="Buscar por email ou UID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filter && <span className="badge badge-warning">Filtro: {filter}</span>}
      </div>

      {loading ? (
        <div className="loading-state">
          <md-circular-progress indeterminate />
          <span>Carregando usuários...</span>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Plano</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Criado em</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(u => (
                <tr key={u.uid} className={u.disabled ? 'row-disabled' : ''}>
                  <td title={u.email || u.uid}>
                    <div className="gap-row" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || u.uid}</span>
                      {u.isAdmin && <span className="badge badge-admin" style={{ flexShrink: 0 }}>ADMIN</span>}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <PlanBadge plan={u.planType} expiresAt={u.premiumExpiresAt} isPremium={u.isPremium} />
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {u.disabled ? <span className="badge badge-disabled">INATIVO</span> : <span className="badge badge-approved">ativo</span>}
                  </td>

                  <td className="text-muted" style={{ textAlign: 'center' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}</td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-block' }}>
                      <button
                        className="badge badge-free"
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setMenuState(prev => prev && prev.uid === u.uid ? null : { uid: u.uid, rect })
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>more_horiz</span>
                      </button>

                      {menuState?.uid === u.uid && menuState.rect && (
                        <ActionsMenu anchorRect={menuState.rect} user={u} onClose={() => setMenuState(null)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {displayed.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--md-sys-color-on-surface-variant)' }}>Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>

          {pageToken && (
            <div className="load-more-row">
              <md-filled-button onClick={() => load(pageToken)} {...(loadingMore ? { disabled: true } : {})}>
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </md-filled-button>
            </div>
          )}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}

