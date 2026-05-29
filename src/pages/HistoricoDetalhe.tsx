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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState<SimuladoResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !id) return

    setLoading(true)
    getDoc(doc(db, 'users', user.uid, 'results', id))
      .then(snap => {
        if (!snap.exists()) {
          setError('Resultado não encontrado.')
          return
        }
        setResult({ id: snap.id, ...snap.data() } as SimuladoResult)
      })
      .catch(() => setError('Erro ao carregar resultado. Verifique sua conexão.'))
      .finally(() => setLoading(false))
  }, [user, id])

  if (loading) {
    return (
      <div className="page-placeholder">
        <div className="spinner" />
        <p>Carregando resultado...</p>
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
      onRetry={() => navigate('/simulado')}
    />
  )
}
