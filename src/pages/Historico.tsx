import '@material/web/button/filled-button.js'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import { formatDuration } from '../utils/formatDuration'
import type { SimuladoResult } from '../types'

function formatDate(result: SimuladoResult): string {
  try {
    const d = result.completedAt?.toDate
      ? result.completedAt.toDate()
      : new Date((result.completedAt as unknown as { seconds: number }).seconds * 1000)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

function ResultCard({ result, onClick }: { result: SimuladoResult; onClick: () => void }) {
  const pct = Math.round((result.score / result.totalQuestions) * 100)
  const scoreClass = pct >= 80 ? 'hist-score--high' : pct >= 60 ? 'hist-score--mid' : 'hist-score--low'

  return (
    <div
      className="hist-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      aria-label={`Simulado de ${formatDate(result)}: ${result.score} de ${result.totalQuestions} acertos`}
      data-testid="result-card"
    >
      <div className="hist-card-row">
        <span className="hist-date">{formatDate(result)}</span>
        <span className={`hist-score ${scoreClass}`}>
          {result.score}/{result.totalQuestions}
        </span>
        <span className="hist-time">{formatDuration(result.timeSpentSeconds)}</span>
        <span className="hist-chevron material-symbols-outlined" aria-hidden="true">
          chevron_right
        </span>
      </div>
    </div>
  )
}

export function Historico() {
  const { results, loading, error } = useResults()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="page-placeholder">
        <div className="spinner" />
        <p>Carregando histórico...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-placeholder">
        <span className="material-symbols-outlined md-icon--lg md-icon--red">error</span>
        <p className="simulado-error">{error}</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="page-placeholder" data-testid="historico-empty">
        <span className="material-symbols-outlined md-icon--lg md-icon--muted">history</span>
        <h2 className="page-placeholder-title">Histórico</h2>
        <p className="page-placeholder-subtitle">
          Nenhum simulado realizado ainda. Comece agora!
        </p>
        <md-filled-button
          onClick={() => navigate('/simulado')}
          className="btn-full"
          data-testid="go-simulado-btn"
        >
          Começar Simulado
        </md-filled-button>
      </div>
    )
  }

  return (
    <div className="hist-page" data-testid="historico-list">
      <h2 className="hist-title">Histórico</h2>
      <p className="hist-subtitle">{results.length} simulado{results.length !== 1 ? 's' : ''} realizados</p>
      <div className="hist-list">
        {results.map((r) => (
          <ResultCard key={r.id} result={r} onClick={() => navigate(`/historico/${r.id}`)} />
        ))}
      </div>
    </div>
  )
}
