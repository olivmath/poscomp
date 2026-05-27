import '@material/web/button/filled-button.js'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import type { Area } from '../types'

const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']

function SparkBar({ pct }: { pct: number }) {
  const cls = pct >= 80 ? 'spark-bar-fill--high' : pct >= 60 ? 'spark-bar-fill--mid' : 'spark-bar-fill--low'
  return (
    <div className="spark-bar-bg">
      <div className={`spark-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ScoreTimeline({ scores }: { scores: Array<{ score: number; total: number; date: Date }> }) {
  if (scores.length === 0) return null
  const max = Math.max(...scores.map((s) => s.score))

  return (
    <div className="timeline-section">
      <h3 className="analises-section-title">Últimos simulados</h3>
      <div className="timeline-bars">
        {[...scores].reverse().map((s, i) => {
          const heightPct = max > 0 ? (s.score / max) * 100 : 0
          const pct = Math.round((s.score / s.total) * 100)
          const tier = pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low'
          return (
            <div key={i} className="timeline-bar-col" data-testid="timeline-bar">
              <span className={`timeline-score timeline-score--${tier}`}>{s.score}</span>
              <div className="timeline-bar-track">
                <div
                  className={`timeline-bar-fill timeline-bar-fill--${tier}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="timeline-date">
                {s.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Analises() {
  const { analytics, loading, error } = useResults()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="page-placeholder">
        <div className="spinner" />
        <p>Carregando análises...</p>
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

  if (!analytics) {
    return (
      <div className="page-placeholder" data-testid="analises-empty">
        <span className="material-symbols-outlined md-icon--lg md-icon--muted">bar_chart</span>
        <h2 className="page-placeholder-title">Análises</h2>
        <p className="page-placeholder-subtitle">
          Complete pelo menos um simulado para ver suas análises.
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
    <div className="analises-page" data-testid="analises-data">
      <h2 className="hist-title">Análises</h2>
      <p className="hist-subtitle">{analytics.totalSimulados} simulado{analytics.totalSimulados !== 1 ? 's' : ''} realizados</p>

      {/* Hero metrics */}
      <div className="analises-stat-row" data-testid="analises-hero">
        <div className="analises-stat-chip">
          <span className="analises-stat-value">{analytics.overallAccuracy}%</span>
          <span className="analises-stat-label">acurácia</span>
        </div>
        {analytics.bestArea && (
          <div className="analises-stat-chip analises-stat-chip--green">
            <span className="analises-stat-value analises-stat-value--sm">
              {analytics.bestArea} {analytics.byArea[analytics.bestArea]?.pct}%
            </span>
            <span className="analises-stat-label">melhor área</span>
          </div>
        )}
        {analytics.worstArea && analytics.worstArea !== analytics.bestArea && (
          <div className="analises-stat-chip analises-stat-chip--red">
            <span className="analises-stat-value analises-stat-value--sm">
              {analytics.worstArea} {analytics.byArea[analytics.worstArea]?.pct}%
            </span>
            <span className="analises-stat-label">área mais fraca</span>
          </div>
        )}
      </div>

      {/* Per-area table */}
      <div className="analises-section">
        <h3 className="analises-section-title">Desempenho por área</h3>
        <div className="analises-area-list" data-testid="area-table">
          {AREAS.map((area) => {
            const s = analytics.byArea[area]
            if (!s || s.total === 0) return null
            return (
              <div key={area} className="analises-area-row">
                <div className="analises-area-header">
                  <span className="analises-area-name">{area}</span>
                  <span className="analises-area-stats">
                    {s.correct}/{s.total} — {s.pct}%
                  </span>
                </div>
                <SparkBar pct={s.pct} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Sparkline timeline */}
      <ScoreTimeline scores={analytics.recentScores} />
    </div>
  )
}
