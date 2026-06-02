import { useState, useEffect, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, functions } from '../firebase'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface UserRecord {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  disabled: boolean
  isAdmin: boolean
  createdAt: string
  lastSignIn: string
}

interface UserDetail {
  srsCount: number
  resultsCount: number
  planType?: 'pro' | 'pro_max'
  isPremium?: boolean
  premiumExpiresAt?: Date | null
}

const listUsersFn = httpsCallable<{ pageToken?: string }, { users: UserRecord[]; pageToken: string | null }>(functions, 'listUsers')
const disableUserFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'disableUser')
const enableUserFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'enableUser')
const resetUserSrsFn = httpsCallable<{ uid: string }, { success: boolean; deleted: number }>(functions, 'resetUserSrs')
const grantPremiumAdminFn = httpsCallable<{ uid: string; planType: 'pro' | 'pro_max' }, { success: boolean }>(functions, 'grantPremiumAdmin')

export function UsuariosPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [pageToken, setPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionUid, setActionUid] = useState<string | null>(null)
  const [detailUid, setDetailUid] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [grantingPlan, setGrantingPlan] = useState<'pro' | 'pro_max' | null>(null)
  const [search, setSearch] = useState('')

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type?: 'primary' | 'danger'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const load = useCallback(async (token?: string) => {
    setLoading(true)
    try {
      const res = await listUsersFn(token ? { pageToken: token } : {})
      setUsers((prev) => token ? [...prev, ...res.data.users] : res.data.users)
      setPageToken(res.data.pageToken)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter((u) =>
    search === '' ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = (u: UserRecord) => {
    setConfirmConfig({
      isOpen: true,
      title: u.disabled ? 'Reativar Usuário' : 'Desativar Usuário',
      message: `Deseja realmente ${u.disabled ? 'reativar' : 'desativar'} o acesso de ${u.email}?`,
      type: u.disabled ? 'primary' : 'danger',
      onConfirm: async () => {
        setActionUid(u.uid)
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          if (u.disabled) await enableUserFn({ uid: u.uid })
          else await disableUserFn({ uid: u.uid })
          await load()
        } finally {
          setActionUid(null)
        }
      }
    })
  }

  const handleResetSrs = (u: UserRecord) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Resetar Progresso SRS',
      message: `Isso apagará permanentemente todos os cards de revisão de ${u.email}. Esta ação não pode ser desfeita.`,
      type: 'danger',
      onConfirm: async () => {
        setActionUid(u.uid)
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await resetUserSrsFn({ uid: u.uid })
          await load()
        } finally {
          setActionUid(null)
        }
      }
    })
  }

  const openDetail = async (uid: string) => {
    setDetailUid(uid)
    setDetail(null)
    setDetailLoading(true)
    try {
      const [srsSnap, resultsSnap, userDoc] = await Promise.all([
        getDocs(collection(db, `users/${uid}/srs_cards`)),
        getDocs(collection(db, `users/${uid}/results`)),
        getDoc(doc(db, 'users', uid)),
      ])
      const userData = userDoc.data()
      const premiumExpiresAt = userData?.premiumExpiresAt
        ? (userData.premiumExpiresAt.toDate ? userData.premiumExpiresAt.toDate() : new Date(userData.premiumExpiresAt.seconds * 1000))
        : null
      setDetail({
        srsCount: srsSnap.size,
        resultsCount: resultsSnap.size,
        planType: userData?.planType,
        isPremium: userData?.isPremium ?? false,
        premiumExpiresAt,
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleGrantPremium = async (planType: 'pro' | 'pro_max') => {
    if (!detailUid) return
    setGrantingPlan(planType)
    try {
      await grantPremiumAdminFn({ uid: detailUid, planType })
      await openDetail(detailUid)
    } finally {
      setGrantingPlan(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Usuários</h1>
          <p className="page-meta">{users.length} usuários registrados no sistema</p>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Buscar por nome ou e-mail</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Digite para pesquisar..." className="input" type="search" />
      </div>

      {loading && users.length === 0 ? (
        <div className="empty-state"><span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>sync</span><p>Sincronizando usuários...</p></div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Último acesso</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div className="user-info">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="avatar" />
                        ) : (
                          <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 600 }}>
                            {u.displayName?.[0] ?? u.email?.[0] ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="user-name">{u.displayName ?? '—'}</p>
                          <p className="user-email">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={u.disabled ? 'badge badge-red' : 'badge badge-green'}>{u.disabled ? 'Inativo' : 'Ativo'}</span></td>
                    <td>{u.isAdmin ? <span className="badge badge-indigo">Admin</span> : <span className="badge" style={{ background: 'var(--md-sys-color-surface-variant)' }}>User</span>}</td>
                    <td><span className="mono">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('pt-BR') : '—'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDetail(u.uid)} className="btn btn-ghost" title="Ver estatísticas">
                          <span className="material-symbols-outlined">analytics</span>
                          <span className="mobile-hide">Stats</span>
                        </button>
                        <button onClick={() => handleToggle(u)} disabled={actionUid === u.uid} className="btn btn-ghost" title={u.disabled ? 'Ativar' : 'Suspender'}>
                          <span className="material-symbols-outlined">{u.disabled ? 'person_check' : 'person_off'}</span>
                          <span className="mobile-hide">{u.disabled ? 'Ativar' : 'Suspender'}</span>
                        </button>
                        <button onClick={() => handleResetSrs(u)} disabled={actionUid === u.uid} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-error)' }} title="Resetar SRS">
                          <span className="material-symbols-outlined">restart_alt</span>
                          <span className="mobile-hide">Reset SRS</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageToken && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button onClick={() => load(pageToken)} disabled={loading} className="btn btn-ghost">Carregar mais usuários</button>
            </div>
          )}
        </>
      )}

      {detailUid && (
        <div className="modal-backdrop" onClick={() => setDetailUid(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Estatísticas do Usuário</h2></div>
            <div className="modal-body">
              {detailLoading ? <div className="empty-state"><p>Calculando...</p></div> : detail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Plano</span>
                    <span>
                      {detail.isPremium && detail.planType === 'pro_max' ? <span className="badge badge-indigo">Pro MAX</span>
                        : detail.isPremium ? <span className="badge" style={{ background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}>Pro</span>
                        : <span className="badge">Free</span>}
                    </span>
                  </div>
                  {detail.isPremium && detail.premiumExpiresAt && (
                    <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Expira em</span>
                      <span className="mono">{detail.premiumExpiresAt.toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Cards no SRS</span>
                    <span className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{detail.srsCount}</span>
                  </div>
                  <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>Simulados finalizados</span>
                    <span className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{detail.resultsCount}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '12px' }}>Conceder Premium manualmente</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleGrantPremium('pro')} disabled={grantingPlan !== null} className="btn btn-ghost" style={{ flex: 1 }}>
                        <span className="material-symbols-outlined">workspace_premium</span>
                        Pro (1 mês)
                      </button>
                      <button onClick={() => handleGrantPremium('pro_max')} disabled={grantingPlan !== null} className="btn btn-primary" style={{ flex: 1 }}>
                        <span className="material-symbols-outlined">star</span>
                        Pro MAX (1 ano)
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="modal-footer"><button onClick={() => setDetailUid(null)} className="btn btn-primary">Fechar</button></div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        loading={actionUid !== null}
      />
    </div>
  )
}
