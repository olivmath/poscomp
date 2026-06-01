import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { db, functions } from '../firebase'

interface Announcement {
  id: string
  message: string
  active: boolean
  type: 'info' | 'warning' | 'success'
  url?: string | null
  expiresAt?: { seconds: number } | null
}

type AnnouncementType = 'info' | 'warning' | 'success'

const createFn = httpsCallable<{ message: string; active: boolean; type: AnnouncementType; url?: string; expiresAt?: string }, { id: string }>(functions, 'createAnnouncement')
const updateFn = httpsCallable<{ id: string; message?: string; active?: boolean; type?: AnnouncementType; url?: string }, { success: boolean }>(functions, 'updateAnnouncement')
const deleteFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'deleteAnnouncement')


const EMPTY_FORM = { message: '', active: true, type: 'info' as AnnouncementType, url: '' }

export function BannersPage() {
  const [banners, setBanners] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')))
      setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setModal('create') }
  const openEdit = (b: Announcement) => {
    setEditing(b)
    setForm({ message: b.message, active: b.active, type: b.type, url: b.url ?? '' })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, url: form.url || undefined }
      if (modal === 'create') await createFn(payload)
      else if (editing) await updateFn({ id: editing.id, ...payload })
      setModal(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar este banner?')) return
    setDeleting(id)
    try { await deleteFn({ id }); await load() } finally { setDeleting(null) }
  }

  const handleToggle = async (b: Announcement) => {
    if (!b.active) {
      const currentActive = banners.find((x) => x.active && x.id !== b.id)
      if (currentActive) {
        const msg = currentActive.message.length > 60
          ? currentActive.message.slice(0, 60) + '…'
          : currentActive.message
        const ok = confirm(`Ativar este banner vai desativar:\n\n"${msg}"\n\nContinuar?`)
        if (!ok) return
      }
    }
    setToggling(b.id)
    try { await updateFn({ id: b.id, active: !b.active }); await load() } finally { setToggling(null) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Banners</h1>
        <button onClick={openCreate} className="btn btn-primary">
          + Novo banner
        </button>
      </div>

      {loading ? (
        <div className="card"><div className="empty-state">Carregando...</div></div>
      ) : banners.length === 0 ? (
        <div className="card"><div className="empty-state">Nenhum banner criado</div></div>
      ) : (
        <div className="card">
          {banners.map((b) => (
            <div key={b.id} className="item-row">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                <span className={`badge ann-${b.type}`} style={{ marginTop: 2, flexShrink: 0 }}>{b.type}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: b.url ? 4 : 0 }}>{b.message}</p>
                  {b.url && (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono"
                      style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                    >
                      {b.url}
                    </a>
                  )}
                </div>
              </div>
              <div className="item-actions">
                <button
                  onClick={() => handleToggle(b)}
                  disabled={toggling === b.id}
                  className={b.active ? 'btn btn-sm toggle-on' : 'btn btn-sm toggle-off'}
                >
                  {toggling === b.id ? '...' : b.active ? 'Ativo' : 'Inativo'}
                </button>
                <button onClick={() => openEdit(b)} className="btn btn-ghost btn-sm">Editar</button>
                <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id} className="btn btn-danger btn-sm">
                  {deleting === b.id ? '...' : 'Deletar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'create' ? 'Novo Banner' : 'Editar Banner'}</h2>
              <button onClick={() => setModal(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label className="field-label">Mensagem (Markdown)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input"
                    style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                    placeholder="Suporta **negrito**, _itálico_, [links](url), `código`..."
                  />
                  <div style={{
                    border: '1px solid var(--card-border)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    background: 'var(--bg-secondary, #f8f9fa)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    minHeight: 90,
                    color: 'var(--text-primary)',
                  }}>
                    {form.message ? (
                      <div className="md-preview">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                          {form.message}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Preview aparece aqui...</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label className="field-label">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as AnnouncementType })}
                  className="input"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label className="field-label">URL (opcional)</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Ativo imediatamente
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} className="btn btn-ghost">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
