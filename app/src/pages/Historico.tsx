import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { PaywallCard } from '../components/PaywallCard'
import { HistoricoResult } from '../types'

type State = 'loading' | 'paywall' | 'error' | 'empty' | 'lista'

export function Historico() {
  const navigate = useNavigate()
  const { user, userDoc } = useAuth()
  const [state, setState] = useState<State>('loading')
  const [results, setResults] = useState<HistoricoResult[]>([])

  useEffect(() => {
    if (!userDoc) return
    if (!userDoc.isPremium) {
      setState('paywall')
      return
    }
    if (!user) return

    const q = query(
      collection(db, 'users', user.uid, 'results'),
      orderBy('completedAt', 'desc'),
      limit(50)
    )
    getDocs(q)
      .then((snap) => {
        const docs = snap.docs.map((d) => ({ resultId: d.id, ...d.data() } as HistoricoResult))
        setState(docs.length === 0 ? 'empty' : 'lista')
        setResults(docs)
      })
      .catch(() => setState('error'))
  }, [user, userDoc])

  if (state === 'loading') {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
          progress_activity
        </span>
      </div>
    )
  }

  if (state === 'paywall') {
    return (
      <div className="page-shell">
        <PaywallCard
          title="Recurso Premium"
          description="O histórico completo é exclusivo para assinantes."
          ctaLabel="Ver planos"
          onCta={() => navigate('/perfil')}
        />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined">error</span>
        <p>Erro ao carregar histórico.</p>
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined">history</span>
        <h3 style={{ margin: 0 }}>Nenhum simulado ainda</h3>
        <p style={{ margin: 0 }}>Faça seu primeiro simulado para ver o histórico aqui.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            background: 'var(--md-sys-color-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'var(--md-sys-color-on-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Começar Simulado
        </button>
      </div>
    )
  }

  return (
    <div className="page-shell section-stack">
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Histórico</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
          {results.length} simulados realizados
        </p>
      </div>

      {results.map((r, i) => {
        const prev = results[i + 1]
        const trend = prev ? ((r.score / r.totalQuestions) - (prev.score / prev.totalQuestions)) * 100 : null
        const date = new Date(r.completedAt).toLocaleDateString('pt-BR')
        const pct = r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0

        const bestMateria = Object.entries(r.materiaBreakdown ?? {}).sort(
          ([, a], [, b]) => (b.correct / b.total) - (a.correct / a.total)
        )[0]

        return (
          <button
            key={r.resultId}
            onClick={() => navigate(`/historico/${r.resultId}`, { state: { result: r } })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? navigate(`/historico/${r.resultId}`, { state: { result: r } }) : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '12px 16px',
              background: 'var(--color-card-bg)',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)', flex: 1 }}>{date}</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{r.score}/{r.totalQuestions}</span>
              {trend !== null && (
                <span style={{ fontSize: 12, color: trend >= 0 ? 'var(--color-score-high)' : 'var(--color-score-low)', fontWeight: 600 }}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(0)}%
                </span>
              )}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: pct >= 70 ? 'var(--color-score-high)' : pct >= 50 ? 'var(--color-score-mid)' : 'var(--color-score-low)',
                }}
              >
                {pct}%
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 16, opacity: 0.5 }}>chevron_right</span>
            </div>
            {bestMateria && (
              <div style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>workspace_premium</span>
                <span>{bestMateria[0]}: {Math.round((bestMateria[1].correct / bestMateria[1].total) * 100)}%</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
