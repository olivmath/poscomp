import '@material/web/progress/circular-progress.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import { useState, useEffect, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { Question, Materia, Option } from '../types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ModalOverlay } from '../components/ModalOverlay'
import { MarkdownEditor } from '../components/MarkdownEditor'

const MATERIAS: Materia[] = ['Matemática', 'Computação', 'Tecnologias']
const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

interface GetQuestionsResponse { questions: Question[] }

function emptyForm(): Omit<Question, 'id'> {
  return {
    ano: new Date().getFullYear(),
    materia: 'Matemática',
    enunciado: '',
    alternativas: { A: '', B: '', C: '', D: '', E: '' },
    resposta: 'A',
    comentario: '',
    card: { pergunta: '', resposta: '' },
  }
}

export function Questoes() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterMateria, setFilterMateria] = useState<Materia | ''>('')
  const [filterAno, setFilterAno] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [form, setForm] = useState<Omit<Question, 'id'>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable<Record<string, never>, GetQuestionsResponse>(functions, 'listQuestions')
      const res = await fn({})
      setQuestions(res.data.questions ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar questões')
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

  function openEdit(q: Question) {
    setEditing(q)
    const { id: _id, ...rest } = q
    void _id
    setForm({ ...rest, card: rest.card ?? { pergunta: '', resposta: '' } })
    setFormError(null)
    setShowForm(true)
  }

  function validateForm(): string | null {
    if (!form.ano || form.ano < 1900) return 'Ano inválido'
    if (!form.enunciado.trim()) return 'Enunciado obrigatório'
    for (const opt of OPTIONS) if (!form.alternativas[opt]?.trim()) return `Alternativa ${opt} obrigatória`
    return null
  }

  async function save() {
    const err = validateForm()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const fn = httpsCallable(functions, 'updateQuestion')
        await fn({ id: editing.id, ...form })
        setQuestions(qs => qs.map(q => q.id === editing.id ? { ...q, ...form } : q))
      } else {
        const fn = httpsCallable<Omit<Question, 'id'>, { id: number }>(functions, 'createQuestion')
        const res = await fn(form)
        setQuestions(qs => [...qs, { id: res.data.id, ...form }])
      }
      setShowForm(false)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuestion() {
    if (!deleteTarget) return
    try {
      const fn = httpsCallable(functions, 'deleteQuestion')
      await fn({ id: deleteTarget.id })
      setQuestions(qs => qs.filter(q => q.id !== deleteTarget.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar')
    } finally {
      setDeleteTarget(null)
    }
  }

  let displayed = questions
  if (filterMateria) displayed = displayed.filter(q => q.materia === filterMateria)
  if (filterAno) displayed = displayed.filter(q => String(q.ano).includes(filterAno))

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Questões</h1>
        <md-filled-button onClick={openCreate}>
          <span className="material-symbols-outlined" slot="icon">add</span>
          Nova questão
        </md-filled-button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      <div className="toolbar">
        <select className="input" value={filterMateria} onChange={e => setFilterMateria(e.target.value as Materia | '')}>
          <option value="">Todas as matérias</option>
          {MATERIAS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input className="input" placeholder="Filtrar por ano..." value={filterAno} onChange={e => setFilterAno(e.target.value)} style={{ width: 160 }} />
      </div>

      {loading ? (
        <div className="loading-state"><md-circular-progress indeterminate /><span>Carregando...</span></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th style={{ width: 70 }}>Ano</th>
                <th>Matéria</th>
                <th>Enunciado</th>
                <th style={{ width: 80 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(q => (
                <tr key={q.id}>
                  <td className="text-muted">{q.id}</td>
                  <td>{q.ano}</td>
                  <td><span className="badge badge-free">{q.materia}</span></td>
                  <td className="td-truncate">{q.enunciado}</td>
                  <td>
                    <div className="gap-row">
                      <button onClick={() => openEdit(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-score-low)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--md-sys-color-on-surface-variant)' }}>Nenhuma questão encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ModalOverlay onBackdropClick={() => setShowForm(false)} maxWidth={680}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Editar questão' : 'Nova questão'}</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {formError && <div className="error-banner" style={{ marginBottom: 16 }}>{formError}</div>}

          <div className="form-grid">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label form-label-required">Ano</label>
                <input className="input" type="number" value={form.ano} onChange={e => setForm(f => ({ ...f, ano: Number(e.target.value) }))} />
              </div>
              <div className="form-field">
                <label className="form-label form-label-required">Matéria</label>
                <select className="input" value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value as Materia }))}>
                  {MATERIAS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label form-label-required">Enunciado</label>
              <textarea className="textarea" rows={4} value={form.enunciado} onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))} />
            </div>

            <div className="form-field">
              <label className="form-label form-label-required">Alternativas</label>
              <div className="alts-grid">
                {OPTIONS.map(opt => (
                  <div key={opt} className="alt-field">
                    <span className="alt-letter">{opt}:</span>
                    <input className="input" style={{ flex: 1 }} value={form.alternativas[opt] ?? ''} onChange={e => setForm(f => ({ ...f, alternativas: { ...f.alternativas, [opt]: e.target.value } }))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label form-label-required">Gabarito</label>
              <div className="radio-group">
                {OPTIONS.map(opt => (
                  <label key={opt} className="radio-option">
                    <input type="radio" name="resposta" value={opt} checked={form.resposta === opt} onChange={() => setForm(f => ({ ...f, resposta: opt }))} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Comentário Premium (markdown)</label>
              <MarkdownEditor value={form.comentario} onChange={v => setForm(f => ({ ...f, comentario: v }))} rows={5} />
            </div>

            <div className="form-field">
              <label className="form-label">Card flashcard — Pergunta</label>
              <textarea className="textarea" rows={2} value={form.card?.pergunta ?? ''} onChange={e => setForm(f => ({ ...f, card: { ...f.card!, pergunta: e.target.value } }))} />
            </div>

            <div className="form-field">
              <label className="form-label">Card flashcard — Resposta (markdown)</label>
              <MarkdownEditor value={form.card?.resposta ?? ''} onChange={v => setForm(f => ({ ...f, card: { ...f.card!, resposta: v } }))} rows={4} />
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
          title="Deletar questão"
          body={`Deletar questão #${deleteTarget.id}? Ação irreversível. Cards SRS órfãos permanecerão no Firestore.`}
          confirmLabel="Deletar"
          danger
          onConfirm={deleteQuestion}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
