import { useState, useEffect, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { collection, getDocs } from 'firebase/firestore'
import { db, functions } from '../firebase'

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
}

const listUsersFn = httpsCallable<{ pageToken?: string }, { users: UserRecord[]; pageToken: string | null }>(functions, 'listUsers')
const disableUserFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'disableUser')
const enableUserFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'enableUser')
const resetUserSrsFn = httpsCallable<{ uid: string }, { success: boolean; deleted: number }>(functions, 'resetUserSrs')

export function UsuariosPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [pageToken, setPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionUid, setActionUid] = useState<string | null>(null)
  const [detailUid, setDetailUid] = useState<string | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')

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

  const handleToggle = async (u: UserRecord) => {
    if (!confirm(`${u.disabled ? 'Ativar' : 'Desativar'} ${u.email}?`)) return
    setActionUid(u.uid)
    try {
      if (u.disabled) await enableUserFn({ uid: u.uid })
      else await disableUserFn({ uid: u.uid })
      await load()
    } finally {
      setActionUid(null)
    }
  }

  const handleResetSrs = async (u: UserRecord) => {
    if (!confirm(`Resetar SRS de ${u.email}? Isso deleta todos os cards de revisão.`)) return
    setActionUid(u.uid)
    try {
      const res = await resetUserSrsFn({ uid: u.uid })
      alert(`${res.data.deleted} cards deletados.`)
    } finally {
      setActionUid(null)
    }
  }

  const openDetail = async (uid: string) => {
    setDetailUid(uid)
    setDetail(null)
    setDetailLoading(true)
    try {
      const [srsSnap, resultsSnap] = await Promise.all([
        getDocs(collection(db, `users/${uid}/srs_cards`)),
        getDocs(collection(db, `users/${uid}/results`)),
      ])
      setDetail({ srsCount: srsSnap.size, resultsCount: resultsSnap.size })
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="admin-main">
      <div className="page-header">
        <h1 className="page-title">Usuários</h1>
        <p className="page-meta">{users.length} usuários</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por email ou nome..."
        className="search-bar"
        style={{ marginBottom: '1rem' }}
      />

      {loading && users.length === 0 ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Último acesso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div className="user-info">
                        {u.photoURL && <img src={u.photoURL} alt="" className="avatar" />}
                        <div>
                          <p className="user-name">{u.displayName ?? '—'}</p>
                          <p className="user-email">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={u.disabled ? 'badge badge-red' : 'badge badge-green'}>
                        {u.disabled ? 'Desativado' : 'Ativo'}
                      </span>
                    </td>
                    <td>
                      {u.isAdmin && <span className="badge badge-indigo">Admin</span>}
                    </td>
                    <td>
                      {u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openDetail(u.uid)} className="btn btn-ghost btn-sm">Detalhes</button>
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={actionUid === u.uid}
                          className="btn btn-ghost btn-sm"
                        >
                          {u.disabled ? 'Ativar' : 'Desativar'}
                        </button>
                        <button
                          onClick={() => handleResetSrs(u)}
                          disabled={actionUid === u.uid}
                          className="btn btn-danger btn-sm"
                        >
                          Reset SRS
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
                    <div className="empty-state">Nenhum usuário encontrado</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pageToken && (
            <button
              onClick={() => load(pageToken)}
              disabled={loading}
              className="btn btn-ghost"
              style={{ marginTop: '1rem' }}
            >
              Carregar mais...
            </button>
          )}
        </>
      )}

      {detailUid && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Progresso</h2>
              <button onClick={() => setDetailUid(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="empty-state">Carregando...</div>
              ) : detail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>Cards SRS</span>
                    <span style={{ fontWeight: 500 }}>{detail.srsCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>Simulados realizados</span>
                    <span style={{ fontWeight: 500 }}>{detail.resultsCount}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
