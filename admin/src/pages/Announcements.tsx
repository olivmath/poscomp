import '@material/web/progress/circular-progress.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/switch/switch.js'
import { useState, useEffect, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { Announcement, AnnouncementType } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ModalOverlay } from '../components/ModalOverlay'
import { MarkdownEditor } from '../components/MarkdownEditor'

interface GetAnnouncementsResponse { announcements: Announcement[] }

const TYPE_OPTIONS: AnnouncementType[] = ['info', 'warning', 'success']

function emptyForm(): Omit<Announcement, 'id' | 'createdAt'> {
  return { message: '', type: 'info', active: true, url: '', expiresAt: '' }
}

const TYPE_ICON: Record<AnnouncementType, string> = {
  info: 'info',
  warning: 'warning',
  success: 'check_circle',
}

export function Announcements() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<Omit<Announcement, 'id' | 'createdAt'>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<Record<string, never>, GetAnnouncementsResponse>(functions, 'listAnnouncements')
      const res = await fn({})
      setItems(res.data.announcements ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({ message: a.message, type: a.type, active: a.active, url: a.url ?? '', expiresAt: a.expiresAt ?? '' })
    setFormError(null)
    setShowForm(true)
  }

  async function save() {
    if (!form.message.trim()) { setFormError('Mensagem obrigatória'); return }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        ...form,
        url: form.url || null,
        expiresAt: form.expiresAt || null,
      }
      if (editing) {
        const fn = httpsCallable(functions, 'updateAnnouncement')
        await fn({ id: editing.id, ...payload })
        setItems(is => is.map(i => i.id === editing.id ? { ...i, ...payload } : i))
      } else {
        const fn = httpsCallable<typeof payload, { id: string }>(functions, 'createAnnouncement')
        const res = await fn(payload)
        setItems(is => [...is, { id: res.data.id, createdAt: new Date().toISOString(), ...payload }])
      }
      setShowForm(false)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(a: Announcement) {
    try {
      const fn = httpsCallable(functions, 'updateAnnouncement')
      await fn({ id: a.id, active: !a.active })
      setItems(is => is.map(i => i.id === a.id ? { ...i, active: !a.active } : i))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar')
    }
  }

  async function deleteAnnouncement() {
    if (!deleteTarget) return
    try {
      const fn = httpsCallable(functions, 'deleteAnnouncement')
      await fn({ id: deleteTarget.id })
      setItems(is => is.filter(i => i.id !== deleteTarget.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <md-filled-button onClick={openCreate}>
          <span className="material-symbols-outlined" slot="icon">add</span>
          Novo banner
        </md-filled-button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state"><md-circular-progress indeterminate /><span>Carregando...</span></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mensagem</th>
                <th style={{ width: 90 }}>Tipo</th>
                <th style={{ width: 80 }}>Ativo</th>
                <th style={{ width: 110 }}>Expira em</th>
                <th style={{ width: 80 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td className="td-truncate">
                    <div className="gap-row">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: a.type === 'warning' ? 'var(--color-score-mid)' : a.type === 'success' ? 'var(--color-score-high)' : 'var(--md-sys-color-primary)' }}>
                        {TYPE_ICON[a.type]}
                      </span>
                      {a.message.slice(0, 80)}{a.message.length > 80 ? '…' : ''}
                    </div>
                  </td>
                  <td><span className={`badge badge-${a.type}`}>{a.type}</span></td>
                  <td>
                    <md-switch
                      selected={a.active}
                      onChange={() => toggleActive(a)}
                    />
                  </td>
                  <td className="text-muted">
                    {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td>
                    <div className="gap-row">
                      <button onClick={() => openEdit(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-primary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-score-low)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--md-sys-color-on-surface-variant)' }}>Nenhum banner criado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ModalOverlay onBackdropClick={() => setShowForm(false)} maxWidth={620}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Editar banner' : 'Novo banner'}</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {formError && <div className="error-banner" style={{ marginBottom: 14 }}>{formError}</div>}

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label form-label-required">Mensagem (markdown)</label>
              <MarkdownEditor value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} rows={5} />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label form-label-required">Tipo</label>
                <div className="radio-group">
                  {TYPE_OPTIONS.map(t => (
                    <label key={t} className="radio-option">
                      <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} />
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{TYPE_ICON[t]}</span>
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Ativo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                  <md-switch selected={form.active} onChange={() => setForm(f => ({ ...f, active: !f.active }))} />
                  <span style={{ fontSize: 13 }}>{form.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">URL (opcional)</label>
                <input className="input" placeholder="https://..." value={form.url ?? ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Expira em (opcional)</label>
                <input className="input" type="datetime-local" value={form.expiresAt ?? ''} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <md-text-button onClick={() => setShowForm(false)}>Cancelar</md-text-button>
            <md-filled-button onClick={save} {...(saving ? { disabled: true } : {})}>
              {saving ? 'Salvando...' : 'Salvar'}
            </md-filled-button>
          </div>
        </ModalOverlay>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Deletar banner"
          body={`Deletar o banner "${deleteTarget.message.slice(0, 40)}…"?`}
          confirmLabel="Deletar"
          danger
          onConfirm={deleteAnnouncement}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
