import '@material/web/button/filled-button.js'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { RelatorioFinal } from '../components/RelatorioFinal'
import type { SimuladoResult } from '../types'

export function HistoricoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { user, isPremium, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState<SimuladoResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !id || profileLoading || !isPremium) {
      if (!profileLoading) setLoading(false)
      return
    }

    setLoading(true)
    getDoc(doc(db, 'users', user.uid, 'results', id))
      .then(snap => {
        if (!snap.exists()) {
          setError('Resultado não encontrado.')
          return
        }
        const raw = snap.data() as Record<string, unknown>
        const rawAnswers = (raw.answers ?? []) as Array<Record<string, unknown>>

        const answers = rawAnswers.map(a => ({
          questionId: a.questionId as number,
          selected: (a.selected as string | null) ?? null,
          correct: (a.correct as boolean) ?? false,
          skipped: (a.skipped as boolean) ?? !a.selected,
          confidence: (a.confidence as string | null) ?? null,
        })) as SimuladoResult['answers']

        const questionReviews = (raw.questionReviews as SimuladoResult['questionReviews']) ??
          rawAnswers
            .filter(a => a.question != null)
            .map(a => {
              const q = a.question as Record<string, unknown>
              return {
                id: a.questionId as number,
                ano: (q.ano as number) ?? 0,
                area: q.area,
                enunciado: q.enunciado as string,
                alternativas: q.alternativas as Record<string, string>,
                resposta: q.resposta as string,
                comentario: q.comentario as string | undefined,
              }
            }) as SimuladoResult['questionReviews']

        setResult({ id: snap.id, ...raw, answers, questionReviews } as SimuladoResult)
      })
      .catch(() => setError('Erro ao carregar resultado. Verifique sua conexão.'))
      .finally(() => setLoading(false))
  }, [user, id, isPremium, profileLoading])

  if (profileLoading || loading) {
    return (
      <div className="page-placeholder">
        <div className="spinner" />
        <p>Carregando resultado...</p>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="revisao-container revisao-container--center">
        <div className="revisao-paywall-card">
          <span className="material-symbols-outlined revisao-paywall-icon">lock</span>
          <h2 className="revisao-paywall-title">Recurso Premium</h2>
          <p className="revisao-paywall-desc">O histórico de simulados + Comentários são exclusivos para assinantes.</p>
          <md-filled-button onClick={() => navigate('/perfil')}>
            Assinar Agora
          </md-filled-button>
        </div>
      </div>
    )
  }


  if (error || !result) {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined md-icon--lg md-icon--red">error</span>
        <p className="simulado-error">{error ?? 'Resultado não encontrado.'}</p>
        <md-filled-button onClick={() => navigate('/historico')} className="btn-full">
          Voltar ao Histórico
        </md-filled-button>
      </div>
    )
  }

  return (
    <RelatorioFinal
      result={result}
      onBack={() => navigate('/historico')}
    />
  )
}
