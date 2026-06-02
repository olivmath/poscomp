import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { db, functions } from '../firebase'
import { ConfirmDialog } from '../components/ConfirmDialog'

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel', 'class', /^data-/],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    iframe: ['src', 'width', 'height', 'frameborder', 'style', 'allow', 'aria-hidden', 'tabindex'],
    div: [...(defaultSchema.attributes?.div ?? []), 'style', 'class'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'img', 'iframe'],
}

const mdComponents = {
  a: ({ href, className, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  ),
  img: ({ src, alt, width, height, style }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} width={width} height={height}
      style={{ maxWidth: '100%', borderRadius: 6, marginTop: 4, ...(style as React.CSSProperties) }} />
  ),
  iframe: ({ src, width, height, ...rest }: React.IframeHTMLAttributes<HTMLIFrameElement>) => (
    <div style={{ width: '100%', overflowX: 'auto', marginTop: 6 }}>
      <iframe src={src} width={width ?? '100%'} height={height ?? 400}
        style={{ maxWidth: '100%', display: 'block', border: 'none', borderRadius: 6 }}
        {...rest} />
    </div>
  ),
}

function collapseHtmlTags(md: string): string {
  return md.replace(/<[^<>]+>/gs, (tag) => tag.replace(/\s*\n\s*/g, ' '))
}

const HELP_CONTENT = `
## Formatação Básica
- **Negrito**: \`**texto**\`
- *Itálico*: \`_texto_\`
- [Link](https://google.com): \`[texto](url)\`

## Imagens e Embeds
![Alt](url) ou use tags HTML para tamanho fixo.
`

interface Announcement {
  id: string; message: string; active: boolean; type: 'info' | 'warning' | 'success'; url?: string | null;
}
type AnnouncementType = 'info' | 'warning' | 'success'

const createFn = httpsCallable<{ message: string; active: boolean; type: AnnouncementType; url?: string }, { id: string }>(functions, 'createAnnouncement')
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
  const [showHelp, setShowHelp] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'primary' | 'danger'; confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')))
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, url: form.url || undefined }
      if (modal === 'create') await createFn(payload)
      else if (editing) await updateFn({ id: editing.id, ...payload })
      setModal(null); await load()
    } finally { setSaving(false) }
  }

  const handleDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true, title: 'Excluir Comunicado', message: 'Tem certeza? Isso removerá o banner para todos os usuários imediatamente.', type: 'danger', confirmLabel: 'Excluir Agora',
      onConfirm: async () => { setDeleting(id); setConfirmConfig(p => ({ ...p, isOpen: false })); try { await deleteFn({ id }); await load() } finally { setDeleting(null) } }
    })
  }

  const handleToggle = (b: Announcement) => {
    const perform = async () => { setToggling(b.id); try { await updateFn({ id: b.id, active: !b.active }); await load() } finally { setToggling(null) } }
    if (!b.active && banners.some(x => x.active && x.id !== b.id)) {
      setConfirmConfig({ isOpen: true, title: 'Trocar Banner Ativo', message: 'Já existe um banner ativo. Deseja desativá-lo e ativar este?', onConfirm: () => { setConfirmConfig(p => ({ ...p, isOpen: false })); perform() } })
    } else perform()
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Gestão de Banners</h1><p className="page-meta">{banners.length} comunicados configurados</p></div>
        <button onClick={() => { setForm(EMPTY_FORM); setEditing(null); setModal('create') }} className="btn btn-primary"><span className="material-symbols-outlined">add</span><span>Novo Banner</span></button>
      </div>

      {loading ? (<div className="empty-state"><p>Carregando...</p></div>) : (
        <div className="card">
          {banners.map(b => (
            <div key={b.id} className="item-row" style={{ opacity: b.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `var(--md-sys-color-${b.type}-container)`, color: `var(--md-sys-color-on-${b.type}-container)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">{b.type === 'info' ? 'info' : b.type === 'warning' ? 'warning' : 'check_circle'}</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><strong>{b.type.toUpperCase()}</strong>{!b.active && <span className="badge" style={{ background: 'var(--md-sys-color-surface-variant)' }}>Inativo</span>}</div>
                  <p style={{ margin: '4px 0', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.message.replace(/<[^>]*>/g, '').trim() || '(sem texto)'}</p>
                </div>
              </div>
              <div className="item-actions">
                <button onClick={() => handleToggle(b)} disabled={toggling === b.id} className={`btn ${b.active ? 'btn-primary' : 'btn-ghost'}`} style={{ minWidth: '100px' }}>{b.active ? 'Ativo' : 'Ativar'}</button>
                <button onClick={() => { setEditing(b); setForm({ ...b, url: b.url ?? '' }); setModal('edit') }} className="btn btn-ghost" title="Editar"><span className="material-symbols-outlined">edit</span><span className="mobile-hide">Editar</span></button>
                <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-error)' }} title="Excluir"><span className="material-symbols-outlined">delete</span><span className="mobile-hide">Excluir</span></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{modal === 'create' ? 'Novo Comunicado' : 'Editar Comunicado'}</h2></div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Conteúdo (Markdown)</span><button type="button" onClick={() => setShowHelp(true)} className="btn btn-ghost" style={{ height: '24px', fontSize: '12px' }}>Ver Ajuda</button></label>
                <div className="responsive-grid">
                  <textarea rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input mono" placeholder="Digite a mensagem..." />
                  <div style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '12px', padding: '16px', background: 'var(--md-sys-color-surface-container)', overflowY: 'auto', maxHeight: '200px' }}>
                    <div className="md-preview"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]} components={mdComponents}>{collapseHtmlTags(form.message)}</ReactMarkdown></div>
                  </div>
                </div>
              </div>
              <div className="responsive-grid" style={{ marginTop: '24px' }}>
                <div className="field"><label className="field-label">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as AnnouncementType })} className="input"><option value="info">Informação</option><option value="warning">Aviso</option><option value="success">Sucesso</option></select></div>
                <div className="field"><label className="field-label">Link de Destino</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="input" type="url" /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'var(--md-sys-color-secondary-container)', borderRadius: '8px', width: 'fit-content' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                <strong>Ativar banner imediatamente</strong>
              </label>
            </div>
            <div className="modal-footer"><button onClick={() => setModal(null)} className="btn btn-ghost">Cancelar</button><button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : 'Salvar e Publicar'}</button></div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="modal-backdrop" style={{ zIndex: 100 }} onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Ajuda de Formatação</h2></div>
            <div className="modal-body"><div className="md-preview"><ReactMarkdown remarkPlugins={[remarkGfm]}>{HELP_CONTENT}</ReactMarkdown></div></div>
            <div className="modal-footer"><button onClick={() => setShowHelp(false)} className="btn btn-primary">Entendido</button></div>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} confirmLabel={confirmConfig.confirmLabel} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))} loading={deleting !== null} />
    </div>
  )
}
