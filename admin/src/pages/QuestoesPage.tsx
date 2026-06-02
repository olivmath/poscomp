import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import type { Question, Area, Option } from '../../../app/src/types/index'
import { ConfirmDialog } from '../components/ConfirmDialog'

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
  const [filterAno, setFilterAno] = useState<number | ''>('')
  const [filterCard, setFilterCard] = useState<'all' | 'with' | 'without'>('all')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Question | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type?: 'primary' | 'danger'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const load = async () => {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'questions'), orderBy('id')))
    setQuestions(snap.docs.map((d) => d.data() as Question))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = questions.filter((q) => {
    const matchArea = filterArea === '' || q.area === filterArea
    const matchAno = filterAno === '' || q.ano === filterAno
    const matchCard = filterCard === 'all' ? true : filterCard === 'with' ? !!q.card : !q.card
    const matchSearch = search === '' || String(q.id).includes(search) || q.enunciado.toLowerCase().includes(search.toLowerCase())
    return matchArea && matchAno && matchCard && matchSearch
  })

  const years = Array.from(new Set(questions.map(q => q.ano))).sort((a, b) => b - a)

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setModal('create') }
  const openEdit = (q: Question) => {
    setEditing(q)
    setForm({
      ano: q.ano, area: q.area, enunciado: q.enunciado, alternativas: { ...q.alternativas }, resposta: q.resposta, comentario: q.comentario ?? '',
      card: { pergunta: q.card?.pergunta ?? '', resposta: q.card?.resposta ?? '', solucao_md: q.card?.solucao_md ?? '' },
    })
    setModal('edit')
  }

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Questão',
      message: `Tem certeza que deseja excluir permanentemente a questão #${id}? Esta ação não pode ser desfeita.`,
      type: 'danger',
      onConfirm: async () => {
        setDeleting(id)
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try { await deleteQuestion({ id }); await load() } finally { setDeleting(null) }
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, card: form.card.pergunta ? form.card : undefined, comentario: form.comentario || undefined }
      if (modal === 'create') await createQuestion(payload)
      else if (editing) await updateQuestion({ id: editing.id, ...payload })
      setModal(null)
      await load()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banco de Questões</h1>
          <p className="page-meta">{questions.length} questões cadastradas</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" aria-label="Criar nova questão">
          <span className="material-symbols-outlined">add</span>
          Nova questão
        </button>
      </div>

      <div className="responsive-grid" style={{ marginBottom: '32px', alignItems: 'end' }}>
        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Busca Livre</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID ou texto..." className="input" type="search" />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Área</label>
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value as Area | '')} className="input">
            <option value="">Todas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Ano</label>
          <select value={filterAno} onChange={(e) => setFilterAno(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">Todos</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Flashcard</label>
          <div className="tickets-chip-group" style={{ height: '48px', alignItems: 'center' }}>
            <button onClick={() => setFilterCard('all')} className={`tickets-chip${filterCard === 'all' ? ' tickets-chip-active' : ''}`}>Todas</button>
            <button onClick={() => setFilterCard('with')} className={`tickets-chip${filterCard === 'with' ? ' tickets-chip-active' : ''}`} title="Com Card SRS">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>style</span>
            </button>
            <button onClick={() => setFilterCard('without')} className={`tickets-chip${filterCard === 'without' ? ' tickets-chip-active' : ''}`} title="Sem Card SRS">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>layers_clear</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>sync</span><p>Carregando banco...</p></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '100px' }}>Ano</th>
                <th style={{ width: '200px' }}>Área</th>
                <th>Enunciado</th>
                <th style={{ width: '80px' }}>Card</th>
                <th style={{ textAlign: 'right' }}>Gerenciamento</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>#{q.id}</span></td>
                  <td><span className="badge" style={{ background: 'var(--md-sys-color-surface-container-high)' }}>{q.ano}</span></td>
                  <td><span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--md-sys-color-primary)' }}>{q.area}</span></td>
                  <td><div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>{q.enunciado}</div></td>
                  <td>
                    {q.card ? (
                      <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ opacity: 0.2 }}>circle</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(q)} className="btn btn-ghost" title="Editar">
                        <span className="material-symbols-outlined">edit</span>
                        <span className="mobile-hide">Editar</span>
                      </button>
                      <button onClick={() => handleDelete(q.id)} disabled={deleting === q.id} className="btn btn-ghost" style={{ color: 'var(--md-sys-color-error)' }} title="Excluir">
                        <span className="material-symbols-outlined">delete</span>
                        <span className="mobile-hide">Excluir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'create' ? 'Nova Questão' : `Editar Questão #${editing?.id}`}</h2>
            </div>
            <div className="modal-body">
              <div className="responsive-grid" style={{ marginBottom: '24px' }}>
                <div className="field">
                  <label className="field-label">Ano da Prova</label>
                  <input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} className="input" />
                </div>
                <div className="field">
                  <label className="field-label">Grande Área</label>
                  <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as Area })} className="input">
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Enunciado da Questão</label>
                <textarea rows={6} value={form.enunciado} onChange={(e) => setForm({ ...form, enunciado: e.target.value })} className="input" style={{ resize: 'vertical' }} />
              </div>
              <div className="responsive-grid" style={{ marginBottom: '24px' }}>
                {OPTIONS.map((opt) => (
                  <div key={opt} className="field">
                    <label className="field-label">Alternativa {opt}</label>
                    <input value={form.alternativas[opt]} onChange={(e) => setForm({ ...form, alternativas: { ...form.alternativas, [opt]: e.target.value } })} className="input" />
                  </div>
                ))}
                <div className="field">
                  <label className="field-label">Resposta Correta (Gabarito)</label>
                  <select value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value as Option })} className="input" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontWeight: 700 }}>
                    {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Comentário / Explicação (Markdown)</label>
                <textarea rows={3} value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} className="input" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ background: 'var(--md-sys-color-surface-container)', padding: '24px', borderRadius: '16px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-primary)' }}>style</span><span className="section-label" style={{ margin: 0 }}>Flashcard SRS</span></div>
                <div className="field"><label className="field-label">Pergunta (Frente)</label><textarea rows={2} value={form.card.pergunta} onChange={(e) => setForm({ ...form, card: { ...form.card, pergunta: e.target.value } })} className="input" placeholder="O que perguntar ao usuário?" /></div>
                <div className="responsive-grid">
                  <div className="field"><label className="field-label">Resposta (Verso)</label><textarea rows={4} value={form.card.resposta} onChange={(e) => setForm({ ...form, card: { ...form.card, resposta: e.target.value } })} className="input mono" placeholder="A resposta curta..." /></div>
                  <div className="field"><label className="field-label">Solução Detalhada (Opcional)</label><textarea rows={4} value={form.card.solucao_md} onChange={(e) => setForm({ ...form, card: { ...form.card, solucao_md: e.target.value } })} className="input mono" placeholder="Passo a passo..." /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} className="btn btn-ghost">Descartar</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : 'Salvar Questão'}</button>
            </div>
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
        loading={deleting !== null}
      />
    </div>
  )
}
