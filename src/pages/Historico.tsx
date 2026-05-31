import '@material/web/button/filled-button.js'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import { formatDuration } from '../utils/formatDuration'
import { AREA_ICONS } from '../utils/areaIcons'
import type { SimuladoResult, Area } from '../types'

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

function topArea(result: SimuladoResult): { area: Area; pct: number } | null {
  const breakdown = result.areaBreakdown
  if (!breakdown) return null
  const areas = Object.entries(breakdown) as [Area, { correct: number; total: number }][]
  const best = areas.reduce((acc, [area, { correct, total }]) => {
    if (total === 0) return acc
    const pct = correct / total
    return pct > acc.pct ? { area, pct } : acc
  }, { area: '' as Area, pct: -1 })
  return best.pct >= 0 ? { area: best.area, pct: Math.round(best.pct * 100) } : null
}

function ResultCard({ result, prevResult, onClick }: { result: SimuladoResult; prevResult?: SimuladoResult; onClick: () => void }) {
  const pct = Math.round((result.score / result.totalQuestions) * 100)
  const scoreClass = pct >= 80 ? 'hist-score--high' : pct >= 60 ? 'hist-score--mid' : 'hist-score--low'
  const best = topArea(result)

  const trend = prevResult
    ? Math.round((result.score / result.totalQuestions) * 100) - Math.round((prevResult.score / prevResult.totalQuestions) * 100)
    : null

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
          {trend !== null && (
            <span className={`hist-trend ${trend > 0 ? 'hist-trend--up' : trend < 0 ? 'hist-trend--down' : 'hist-trend--same'}`}>
              {trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : '='}
            </span>
          )}
        </span>
        <span className="hist-time">{formatDuration(result.timeSpentSeconds)}</span>
        <span className="hist-chevron material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </div>
      {best && (
        <div className="hist-card-meta">
          <span className="material-symbols-outlined hist-area-icon" aria-hidden="true">{AREA_ICONS[best.area]}</span>
          <span className="hist-area-label">{best.area}: {best.pct}%</span>
        </div>
      )}
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
      <h1 className="sr-only">Histórico</h1>
      <h2 className="hist-title">Histórico</h2>
      <p className="hist-subtitle">{results.length} simulado{results.length !== 1 ? 's' : ''} realizados</p>
      <div className="hist-list">
        {results.map((r, i) => (
          <ResultCard key={r.id} result={r} prevResult={results[i + 1]} onClick={() => navigate(`/historico/${r.id}`)} />
        ))}
      </div>
    </div>
  )
}
