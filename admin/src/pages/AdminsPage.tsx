import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

interface UserRecord {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  disabled: boolean
  isAdmin: boolean
}

const listUsersFn = httpsCallable<Record<string, never>, { users: UserRecord[]; pageToken: string | null }>(functions, 'listUsers')
const setAdminRoleFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'setAdminRole')
const revokeAdminRoleFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'revokeAdminRole')

export function AdminsPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionUid, setActionUid] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listUsersFn({})
      setUsers(res.data.users)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const admins = users.filter((u) => u.isAdmin)
  const nonAdmins = users.filter((u) => !u.isAdmin && (
    search === '' ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  ))

  const handlePromote = async (u: UserRecord) => {
    if (!confirm(`Promover ${u.email} a admin?`)) return
    setActionUid(u.uid)
    try { await setAdminRoleFn({ uid: u.uid }); await load() } finally { setActionUid(null) }
  }

  const handleRevoke = async (u: UserRecord) => {
    if (!confirm(`Revogar acesso admin de ${u.email}?`)) return
    setActionUid(u.uid)
    try { await revokeAdminRoleFn({ uid: u.uid }); await load() } finally { setActionUid(null) }
  }

  return (
    <div className="admin-main">
      <div className="page-header">
        <h1 className="page-title">Admins</h1>
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2 className="section-label">Admins atuais</h2>
        {loading ? (
          <div className="empty-state">Carregando...</div>
        ) : (
          <div className="card">
            {admins.length === 0 && <div className="empty-state">Nenhum admin</div>}
            {admins.map((u) => (
              <div key={u.uid} className="item-row">
                <div className="user-info">
                  {u.photoURL && <img src={u.photoURL} alt="" className="avatar" />}
                  <div>
                    <p className="user-name">{u.displayName ?? '—'}</p>
                    <p className="user-email">{u.email}</p>
                  </div>
                </div>
                <div className="item-actions">
                  <span className="badge badge-indigo">admin</span>
                  <button
                    onClick={() => handleRevoke(u)}
                    disabled={actionUid === u.uid}
                    className="btn btn-danger btn-sm"
                  >
                    {actionUid === u.uid ? '...' : 'Revogar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-label">Promover usuário</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email ou nome..."
          className="search-bar"
          style={{ marginBottom: '1rem' }}
        />
        <div className="card">
          {nonAdmins.length === 0 && <div className="empty-state">Nenhum usuário encontrado</div>}
          {nonAdmins.slice(0, 20).map((u) => (
            <div key={u.uid} className="item-row">
              <div className="user-info">
                {u.photoURL && <img src={u.photoURL} alt="" className="avatar" />}
                <div>
                  <p className="user-name">{u.displayName ?? '—'}</p>
                  <p className="user-email">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => handlePromote(u)}
                disabled={actionUid === u.uid}
                className="btn btn-primary btn-sm"
              >
                {actionUid === u.uid ? '...' : 'Promover'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
