import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import type { Question, Area, Option } from '../../../src/types/index'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']
const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

const createQuestion = httpsCallable(functions, 'createQuestion')
const updateQuestion = httpsCallable(functions, 'updateQuestion')
const deleteQuestion = httpsCallable(functions, 'deleteQuestion')

const EMPTY_FORM = {
  ano: new Date().getFullYear(),
  area: 'Matemática' as Area,
  enunciado: '',
  alternativas: { A: '', B: '', C: '', D: '', E: '' } as Record<Option, string>,
  resposta: 'A' as Option,
  comentario: '',
  card: { pergunta: '', resposta: '', solucao_md: '' },
}

export function QuestoesPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState<Area | ''>('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Question | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'questions'), orderBy('id')))
    setQuestions(snap.docs.map((d) => d.data() as Question))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = questions.filter((q) => {
    const matchArea = filterArea === '' || q.area === filterArea
    const matchSearch = search === '' || String(q.id).includes(search) || q.enunciado.toLowerCase().includes(search.toLowerCase())
    return matchArea && matchSearch
  })

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setModal('create')
  }

  const openEdit = (q: Question) => {
    setEditing(q)
    setForm({
      ano: q.ano,
      area: q.area,
      enunciado: q.enunciado,
      alternativas: { ...q.alternativas },
      resposta: q.resposta,
      comentario: q.comentario ?? '',
      card: { pergunta: q.card?.pergunta ?? '', resposta: q.card?.resposta ?? '', solucao_md: q.card?.solucao_md ?? '' },
    })
    setModal('edit')
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`Deletar questão #${id}?`)) return
    setDeleting(id)
    try {
      await deleteQuestion({ id })
      await load()
    } finally {
      setDeleting(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        card: form.card.pergunta ? form.card : undefined,
        comentario: form.comentario || undefined,
      }
      if (modal === 'create') {
        await createQuestion(payload)
      } else if (editing) {
        await updateQuestion({ id: editing.id, ...payload })
      }
      setModal(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Questões</h1>
        <button onClick={openCreate} className="btn btn-primary">
          + Nova questão
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID ou enunciado..."
          className="search-bar"
        />
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value as Area | '')}
          className="input"
        >
          <option value="">Todas as áreas</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ano</th>
                <th>Área</th>
                <th>Enunciado</th>
                <th>Gabarito</th>
                <th>Card</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td><span className="mono">#{q.id}</span></td>
                  <td>{q.ano}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.area}</td>
                  <td>{q.enunciado}</td>
                  <td>{q.resposta}</td>
                  <td>{q.card ? '✓' : '–'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(q)} className="btn btn-ghost btn-sm">Editar</button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                      className="btn btn-danger btn-sm"
                    >
                      {deleting === q.id ? '...' : 'Deletar'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 32 }} className="empty-state">Nenhuma questão encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'create' ? 'Nova Questão' : `Editar Questão #${editing?.id}`}</h2>
              <button onClick={() => setModal(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="field-label">Ano</label>
                  <input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}
                    className="input" />
                </div>
                <div className="field">
                  <label className="field-label">Área</label>
                  <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as Area })}
                    className="input">
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Enunciado</label>
                <textarea rows={4} value={form.enunciado} onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
                  className="input" />
              </div>
              {OPTIONS.map((opt) => (
                <div key={opt} className="field">
                  <label className="field-label">Alternativa {opt}</label>
                  <input value={form.alternativas[opt]} onChange={(e) => setForm({ ...form, alternativas: { ...form.alternativas, [opt]: e.target.value } })}
                    className="input" />
                </div>
              ))}
              <div className="field">
                <label className="field-label">Gabarito</label>
                <select value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value as Option })}
                  className="input">
                  {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Comentário (opcional)</label>
                <textarea rows={2} value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  className="input" />
              </div>
              <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border-light)', paddingTop: 16, marginTop: 16 }}>
                <p className="section-label">Card SRS (opcional)</p>
                <div className="field">
                  <label className="field-label">Pergunta do card</label>
                  <textarea rows={2} value={form.card.pergunta} onChange={(e) => setForm({ ...form, card: { ...form.card, pergunta: e.target.value } })}
                    className="input" />
                </div>
                <div className="field">
                  <label className="field-label">Resposta do card (Markdown/LaTeX)</label>
                  <textarea rows={3} value={form.card.resposta} onChange={(e) => setForm({ ...form, card: { ...form.card, resposta: e.target.value } })}
                    className="input mono" />
                </div>
                <div className="field">
                  <label className="field-label">Solução (Markdown, opcional)</label>
                  <textarea rows={2} value={form.card.solucao_md} onChange={(e) => setForm({ ...form, card: { ...form.card, solucao_md: e.target.value } })}
                    className="input mono" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} className="btn btn-ghost">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="btn btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
