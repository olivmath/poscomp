import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import type { Question, Area, Option } from '../../../app/src/types/index'

interface FlaggedQuestion {
  id: string
  questionId: number
  comment?: string | null
  resolved: boolean
  createdAt: { seconds?: number; _seconds?: number } | null
}

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']
const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

const getFlaggedQuestionsFn = httpsCallable<void, FlaggedQuestion[]>(functions, 'getFlaggedQuestions')
const resolveFlaggedQuestionFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'resolveFlaggedQuestion')
const deleteFlaggedQuestionFn = httpsCallable<{ id: string }, { success: boolean }>(functions, 'deleteFlaggedQuestion')
const updateQuestionFn = httpsCallable(functions, 'updateQuestion')

function formatDate(ts: FlaggedQuestion['createdAt']): string {
  if (!ts) return '—'
  const secs = ts._seconds ?? ts.seconds
  if (!secs) return '—'
  return new Date(secs * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const EMPTY_FORM = {
  ano: new Date().getFullYear(),
  area: 'Matemática' as Area,
  enunciado: '',
  alternativas: { A: '', B: '', C: '', D: '', E: '' } as Record<Option, string>,
  resposta: 'A' as Option,
  comentario: '',
  card: { pergunta: '', resposta: '', solucao_md: '' },
}

export function FlagsPage() {
  const [flags, setFlags] = useState<FlaggedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // edit modal state
  const [editingFlag, setEditingFlag] = useState<FlaggedQuestion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [resolveOnSave, setResolveOnSave] = useState(false)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getFlaggedQuestionsFn()
      setFlags(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleResolve = async (id: string) => {
    if (!confirm('Marcar como resolvido?')) return
    setResolving(id)
    try { await resolveFlaggedQuestionFn({ id }); await load() } finally { setResolving(null) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar este report permanentemente?')) return
    setDeleting(id)
    try { await deleteFlaggedQuestionFn({ id }); await load() } finally { setDeleting(null) }
  }

  const openEdit = async (flag: FlaggedQuestion) => {
    setLoadingQuestion(true)
    setEditingFlag(flag)
    setResolveOnSave(false)
    try {
      const snap = await getDoc(doc(db, 'questions', String(flag.questionId)))
      const q = snap.data() as Question | undefined
      if (q) {
        setForm({
          ano: q.ano,
          area: q.area,
          enunciado: q.enunciado,
          alternativas: { ...q.alternativas },
          resposta: q.resposta,
          comentario: q.comentario ?? '',
          card: {
            pergunta: q.card?.pergunta ?? '',
            resposta: q.card?.resposta ?? '',
            solucao_md: q.card?.solucao_md ?? '',
          },
        })
      }
    } finally {
      setLoadingQuestion(false)
    }
  }

  const handleSave = async () => {
    if (!editingFlag) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        card: form.card.pergunta ? form.card : undefined,
        comentario: form.comentario || undefined,
      }
      await updateQuestionFn({ id: editingFlag.questionId, ...payload })
      if (resolveOnSave) await resolveFlaggedQuestionFn({ id: editingFlag.id })
      setEditingFlag(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Questões Reportadas</h1>
        <span className="page-meta">{flags.length} pendente{flags.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="card"><div className="empty-state">Carregando...</div></div>
      ) : flags.length === 0 ? (
        <div className="card"><div className="empty-state">Nenhuma flag pendente 🎉</div></div>
      ) : (
        <div className="card">
          {flags.map((f) => (
            <div key={f.id} className="item-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: f.comment ? 6 : 0 }}>
                  <span className="badge badge-yellow mono">#{f.questionId}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(f.createdAt)}</span>
                </div>
                {f.comment && (
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 0 }}>
                    {f.comment}
                  </p>
                )}
              </div>
              <div className="item-actions">
                <button
                  onClick={() => openEdit(f)}
                  className="btn btn-ghost btn-sm"
                >
                  Editar questão
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deleting === f.id}
                  className="btn btn-danger btn-sm"
                >
                  {deleting === f.id ? '...' : 'Deletar'}
                </button>
                <button
                  onClick={() => handleResolve(f.id)}
                  disabled={resolving === f.id}
                  className="btn btn-primary btn-sm"
                >
                  {resolving === f.id ? '...' : 'Resolver ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingFlag && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Editar Questão #{editingFlag.questionId}</h2>
              <button onClick={() => setEditingFlag(null)} className="modal-close">×</button>
            </div>

            {loadingQuestion ? (
              <div className="modal-body"><div className="empty-state">Carregando questão...</div></div>
            ) : (
              <>
                <div className="modal-body">
                  {editingFlag.comment && (
                    <div style={{
                      background: 'var(--surface-2, #f8f9fa)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 16,
                      fontSize: 13,
                      color: 'var(--text-muted)',
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Report do usuário:</strong>{' '}
                      {editingFlag.comment}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field">
                      <label className="field-label">Ano</label>
                      <input type="number" value={form.ano}
                        onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}
                        className="input" />
                    </div>
                    <div className="field">
                      <label className="field-label">Área</label>
                      <select value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value as Area })}
                        className="input">
                        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Enunciado</label>
                    <textarea rows={4} value={form.enunciado}
                      onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
                      className="input" />
                  </div>

                  {OPTIONS.map((opt) => (
                    <div key={opt} className="field">
                      <label className="field-label">Alternativa {opt}</label>
                      <input value={form.alternativas[opt]}
                        onChange={(e) => setForm({ ...form, alternativas: { ...form.alternativas, [opt]: e.target.value } })}
                        className="input" />
                    </div>
                  ))}

                  <div className="field">
                    <label className="field-label">Gabarito</label>
                    <select value={form.resposta}
                      onChange={(e) => setForm({ ...form, resposta: e.target.value as Option })}
                      className="input">
                      {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div className="field">
                    <label className="field-label">Comentário (opcional)</label>
                    <textarea rows={2} value={form.comentario}
                      onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                      className="input" />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 16 }}>
                    <p className="section-label">Card SRS (opcional)</p>
                    <div className="field">
                      <label className="field-label">Pergunta do card</label>
                      <textarea rows={2} value={form.card.pergunta}
                        onChange={(e) => setForm({ ...form, card: { ...form.card, pergunta: e.target.value } })}
                        className="input" />
                    </div>
                    <div className="field">
                      <label className="field-label">Resposta do card (Markdown/LaTeX)</label>
                      <textarea rows={3} value={form.card.resposta}
                        onChange={(e) => setForm({ ...form, card: { ...form.card, resposta: e.target.value } })}
                        className="input mono" />
                    </div>
                    <div className="field">
                      <label className="field-label">Solução (Markdown, opcional)</label>
                      <textarea rows={2} value={form.card.solucao_md}
                        onChange={(e) => setForm({ ...form, card: { ...form.card, solucao_md: e.target.value } })}
                        className="input mono" />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--surface-2, #f8f9fa)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={resolveOnSave}
                      onChange={(e) => setResolveOnSave(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span>Marcar report como resolvido ao salvar</span>
                  </label>
                </div>

                <div className="modal-footer">
                  <button onClick={() => setEditingFlag(null)} className="btn btn-ghost">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
