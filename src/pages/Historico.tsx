import '@material/web/button/filled-button.js'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import { AREA_ICONS } from '../utils/areaIcons'
import type { Area, SimuladoResult } from '../types'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}min${s > 0 ? ` ${s}s` : ''}`
}

function ResultCard({ result }: { result: SimuladoResult }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((result.score / result.totalQuestions) * 100)
  const scoreClass = pct >= 80 ? 'hist-score--high' : pct >= 60 ? 'hist-score--mid' : 'hist-score--low'

  return (
    <div
      className="hist-card"
      onClick={() => setExpanded((e) => !e)}
      role="button"
      aria-expanded={expanded}
      data-testid="result-card"
    >
      <div className="hist-card-row">
        <span className="hist-date">{formatDate(result)}</span>
        <span className={`hist-score ${scoreClass}`}>
          {result.score}/{result.totalQuestions}
        </span>
        <span className="hist-time">{formatDuration(result.timeSpentSeconds)}</span>
        <span className="hist-chevron material-symbols-outlined">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {expanded && result.areaBreakdown && (
        <div className="hist-breakdown" data-testid="breakdown">
          <table className="hist-breakdown-table">
            <tbody>
              {AREAS.map((area) => {
                const b = result.areaBreakdown[area]
                if (!b) return null
                const ok = b.correct === b.total
                return (
                  <tr key={area}>
                    <td className="hbd-area">
                      <span className="material-symbols-outlined">{AREA_ICONS[area]}</span>
                      {area}
                    </td>
                    <td className="hbd-score">{b.correct}/{b.total}</td>
                    <td className="hbd-icon">
                      <span 
                        className={`material-symbols-outlined md-icon--sm md-icon--filled ${ok ? 'md-icon--green' : 'md-icon--warning'}`}
                        role="img"
                        aria-label={ok ? 'Aprovado' : 'Requer atenção'}
                      >
                        {ok ? 'check_circle' : 'warning'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
          style={{ marginTop: '8px' }}
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
          <ResultCard key={r.id} result={r} />
        ))}
      </div>
    </div>
  )
}
