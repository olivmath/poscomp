import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface UserRecord {
  uid: string; email: string | null; displayName: string | null; photoURL: string | null; disabled: boolean; isAdmin: boolean;
}

const listUsersFn = httpsCallable<Record<string, never>, { users: UserRecord[]; pageToken: string | null }>(functions, 'listUsers')
const setAdminRoleFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'setAdminRole')
const revokeAdminRoleFn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'revokeAdminRole')

export function AdminsPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionUid, setActionUid] = useState<string | null>(null)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'primary' | 'danger'; confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const load = async () => {
    setLoading(true)
    try { const res = await listUsersFn({}); setUsers(res.data.users) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const admins = users.filter(u => u.isAdmin)
  const nonAdmins = users.filter(u => !u.isAdmin && (search === '' || (u.email ?? '').toLowerCase().includes(search.toLowerCase()) || (u.displayName ?? '').toLowerCase().includes(search.toLowerCase())))

  const handlePromote = (u: UserRecord) => {
    setConfirmConfig({
      isOpen: true, title: 'Conceder Privilégios', message: `Promover ${u.email} a administrador do sistema?`, confirmLabel: 'Tornar Admin',
      onConfirm: async () => { setActionUid(u.uid); setConfirmConfig(p => ({ ...p, isOpen: false })); try { await setAdminRoleFn({ uid: u.uid }); await load() } finally { setActionUid(null) } }
    })
  }

  const handleRevoke = (u: UserRecord) => {
    setConfirmConfig({
      isOpen: true, title: 'Revogar Acesso', message: `Remover o acesso administrativo de ${u.email}?`, type: 'danger', confirmLabel: 'Revogar Agora',
      onConfirm: async () => { setActionUid(u.uid); setConfirmConfig(p => ({ ...p, isOpen: false })); try { await revokeAdminRoleFn({ uid: u.uid }); await load() } finally { setActionUid(null) } }
    })
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Configurações de Acesso</h1><p className="page-meta">Gerencie quem pode acessar este painel</p></div>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>admin_panel_settings</span>
          <h2 className="section-label" style={{ margin: 0 }}>Administradores Atuais</h2>
        </div>
        
        {loading ? (<div className="empty-state"><p>Carregando...</p></div>) : (
          <div className="card">
            {admins.length === 0 && <div className="empty-state">Nenhum admin configurado</div>}
            {admins.map(u => (
              <div key={u.uid} className="item-row">
                <div className="user-info">
                  {u.photoURL ? <img src={u.photoURL} alt="" className="avatar" /> : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontWeight: 700 }}>{u.displayName?.[0] ?? u.email?.[0] ?? 'A'}</div>}
                  <div><p className="user-name">{u.displayName ?? 'Sem nome'}</p><p className="user-email">{u.email}</p></div>
                </div>
                <div className="item-actions">
                  <span className="badge badge-indigo">Acesso Total</span>
                  <button onClick={() => handleRevoke(u)} disabled={actionUid === u.uid} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-error)' }} title="Remover acesso"><span className="material-symbols-outlined">person_remove</span><span className="mobile-hide">Revogar</span></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>person_add</span>
          <h2 className="section-label" style={{ margin: 0 }}>Promover Usuário</h2>
        </div>
        <div className="field"><label className="field-label">Pesquise por e-mail ou nome para encontrar usuários</label><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Digite para buscar..." className="input" type="search" /></div>
        <div className="card">
          {nonAdmins.length === 0 && <div className="empty-state">{search ? 'Nenhum usuário encontrado' : 'Busque um usuário para promover'}</div>}
          {nonAdmins.slice(0, 10).map(u => (
            <div key={u.uid} className="item-row">
              <div className="user-info">
                {u.photoURL ? <img src={u.photoURL} alt="" className="avatar" /> : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}>{u.displayName?.[0] ?? u.email?.[0] ?? 'U'}</div>}
                <div><p className="user-name">{u.displayName ?? 'Sem nome'}</p><p className="user-email">{u.email}</p></div>
              </div>
              <button onClick={() => handlePromote(u)} disabled={actionUid === u.uid} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-primary)' }} title="Conceder acesso admin"><span className="material-symbols-outlined">verified_user</span><span>Tornar Admin</span></button>
            </div>
          ))}
        </div>
      </section>
      <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} loading={actionUid !== null} />
    </div>
  )
}
