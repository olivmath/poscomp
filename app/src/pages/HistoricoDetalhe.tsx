import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppBarBack } from '../components/AppBarBack'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { RelatorioFinal } from '../components/RelatorioFinal'
import { SimuladoResult } from '../types'

export function HistoricoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [result, setResult] = useState<SimuladoResult | null>(location.state?.result ?? null)
  const [loading, setLoading] = useState(!result)

  useEffect(() => {
    if (result || !user || !id) return
    getDoc(doc(db, 'users', user.uid, 'results', id))
      .then((snap) => {
        if (snap.exists()) {
          setResult({ resultId: snap.id, ...snap.data() } as SimuladoResult)
        } else {
          navigate('/historico')
        }
      })
      .catch(() => navigate('/historico'))
      .finally(() => setLoading(false))
  }, [user, id])

  if (loading) {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (!result) return null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--md-sys-color-surface)' }}>
      <AppBarBack title="Detalhes do Simulado" onBack={() => navigate('/historico')} />
      <RelatorioFinal result={result} variant="historico-detalhe" />
    </div>
  )
}
