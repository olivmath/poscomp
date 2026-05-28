import '@material/web/button/filled-button.js'
import '@material/web/progress/circular-progress.js'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
import type { Area } from '../types'

const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']

function SparkBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#1B6D1B' : pct >= 60 ? '#7A5900' : '#BA1A1A'
  return (
    <div className="spark-bar-bg">
      <div className="spark-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function ScoreTimeline({ scores }: { scores: Array<{ score: number; total: number; date: Date }> }) {
  if (scores.length === 0) return null
  const max = Math.max(...scores.map((s) => s.score))

  return (
    <div className="timeline-section">
      <h3 className="analises-section-title">Ultimos simulados</h3>
      <div className="timeline-bars">
        {[...scores].reverse().map((s, i) => {
          const heightPct = max > 0 ? (s.score / max) * 100 : 0
          const pct = Math.round((s.score / s.total) * 100)
          const color = pct >= 80 ? '#1B6D1B' : pct >= 60 ? '#7A5900' : '#BA1A1A'
          return (
            <div key={i} className="timeline-bar-col" data-testid="timeline-bar">
              <span className="timeline-score" style={{ color }}>{s.score}</span>
              <div className="timeline-bar-track">
                <div
                  className="timeline-bar-fill"
                  style={{ height: `${heightPct}%`, background: color }}
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
        <p>Carregando analises...</p>
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
        <h2 className="page-placeholder-title">Analises</h2>
        <p className="page-placeholder-subtitle">
          Complete pelo menos um simulado para ver suas analises.
        </p>
        <md-filled-button
          onClick={() => navigate('/simulado')}
          style={{ marginTop: '8px' }}
          data-testid="go-simulado-btn"
        >
          Comecar Simulado
        </md-filled-button>
      </div>
    )
  }

  return (
    <div className="analises-page" data-testid="analises-data">
      <h2 className="hist-title">Analises</h2>
      <p className="hist-subtitle">{analytics.totalSimulados} simulado{analytics.totalSimulados !== 1 ? 's' : ''} realizados</p>

      <div className="analises-hero" data-testid="analises-hero">
        <div className="analises-metric-card">
          <span className="analises-metric-value">{analytics.overallAccuracy}%</span>
          <span className="analises-metric-label">Acuracia geral</span>
        </div>
        {analytics.bestArea && (
          <div className="analises-metric-card analises-metric-card--green">
            <span className="material-symbols-outlined md-icon--md md-icon--filled md-icon--green">emoji_events</span>
            <span className="analises-metric-value analises-metric-value--sm">{analytics.bestArea}</span>
            <span className="analises-metric-label">Melhor area — {analytics.byArea[analytics.bestArea]?.pct}%</span>
          </div>
        )}
        {analytics.worstArea && analytics.worstArea !== analytics.bestArea && (
          <div className="analises-metric-card analises-metric-card--red">
            <span className="material-symbols-outlined md-icon--md md-icon--filled md-icon--red">menu_book</span>
            <span className="analises-metric-value analises-metric-value--sm">{analytics.worstArea}</span>
            <span className="analises-metric-label">Area mais fraca — {analytics.byArea[analytics.worstArea]?.pct}%</span>
          </div>
        )}
      </div>

      <div className="analises-section">
        <h3 className="analises-section-title">Desempenho por area</h3>
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

      <ScoreTimeline scores={analytics.recentScores} />
    </div>
  )
}
