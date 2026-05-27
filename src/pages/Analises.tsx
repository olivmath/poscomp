import '@material/web/button/filled-button.js'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResults } from '../hooks/useResults'
// import { AREA_ICONS } from '../utils/areaIcons'
import type { Area } from '../types'

const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']

const AREA_ICONS: Record<Area, string> = {
  'Matemática':    'calculate',
  'Algoritmos':    'code',
  'Lógica':        'psychology',
  'Banco de Dados':'database',
  'Redes':         'lan',
}

const SLIDES = ['Geral', 'Calibração', 'Heatmap', 'Revisar', 'Relaxar'] as const

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
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const handler = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActiveSlide(idx)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [analytics])

  const goToSlide = (idx: number) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setActiveSlide(idx)
  }

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

      {/* Carousel */}
      <div className="analises-carousel" ref={carouselRef}>

        {/* Slide 1 — Geral */}
        <div className="analises-slide" data-testid="slide-geral">
          <h3 className="analises-section-title">Visão geral</h3>

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

          <div className="analises-section">
            <h3 className="analises-section-title">Desempenho por área</h3>
            <div className="analises-area-list" data-testid="area-table">
              {AREAS.map((area) => {
                const s = analytics.byArea[area]
                if (!s || s.total === 0) return null
                return (
                  <div key={area} className="analises-area-row">
                    <div className="analises-area-header">
                      <div className="analises-area-label">
                        <span className="material-symbols-outlined analises-area-icon">{AREA_ICONS[area]}</span>
                        <span className="analises-area-name">{area}</span>
                      </div>
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

        {/* Slide 2 — Calibração */}
        <div className="analises-slide" data-testid="slide-calibracao">
          <h3 className="analises-section-title">Calibração</h3>
          <p className="analises-calibration-sub">Como seu nível de confiança se traduz em acertos</p>

          <div className="analises-calibration-cards">
            <div className="analises-cal-card analises-cal-card--certain">
              <span className="material-symbols-outlined analises-cal-icon">verified</span>
              <div className="analises-cal-body">
                <span className="analises-cal-label">Quando digo "Tenho certeza"</span>
                <span className="analises-cal-value">{analytics.confidenceStats.certainAccuracy}% de acerto</span>
              </div>
            </div>
            <div className="analises-cal-card analises-cal-card--unsure">
              <span className="material-symbols-outlined analises-cal-icon">help</span>
              <div className="analises-cal-body">
                <span className="analises-cal-label">Quando digo "Não sei"</span>
                <span className="analises-cal-value">{analytics.confidenceStats.unsureAccuracy}% de acerto</span>
              </div>
            </div>
            <div className="analises-cal-card analises-cal-card--skip">
              <span className="material-symbols-outlined analises-cal-icon">skip_next</span>
              <div className="analises-cal-body">
                <span className="analises-cal-label">Taxa de questões puladas</span>
                <span className="analises-cal-value">{analytics.confidenceStats.skipRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 3 — Heatmap */}
        <div className="analises-slide" data-testid="slide-heatmap">
          <h3 className="analises-section-title">Heatmap confiança × área</h3>
          <table className="confidence-table">
            <thead>
              <tr>
                <th className="ct-col--area">Área</th>
                <th className="ct-col--cc">Certeza + Acerto</th>
                <th className="ct-col--cw">Certeza + Erro</th>
                <th className="ct-col--total">Total</th>
              </tr>
            </thead>
            <tbody>
              {AREAS.map((area) => {
                const ac = analytics.areaConfidence[area]
                if (!ac || ac.total === 0) return null
                return (
                  <tr key={area}>
                    <td className="ct-col--area">
                      <span className="material-symbols-outlined md-icon--sm">{AREA_ICONS[area]}</span>
                      {area}
                    </td>
                    <td className={`ct-col--cc ${ac.certainCorrect > 0 ? 'cell--safe' : ''}`}>
                      {ac.certainCorrect}
                    </td>
                    <td className={`ct-col--cw ${ac.certainWrong > 0 ? 'cell--danger' : ''}`}>
                      {ac.certainWrong > 0 ? (
                        <><span className="material-symbols-outlined md-icon--sm md-icon--warning">warning</span>{ac.certainWrong}</>
                      ) : ac.certainWrong}
                    </td>
                    <td className="ct-col--total">{ac.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="analises-heatmap-hint">
            <span className="material-symbols-outlined md-icon--sm md-icon--red">error</span>
            Certeza + Erro = ponto cego — você achava que sabia, mas errou.
          </p>
        </div>

        {/* Slide 4 — O que revisar */}
        <div className="analises-slide" data-testid="slide-revisar">
          <h3 className="analises-section-title">O que revisar</h3>
          {analytics.reviewPriority.length === 0 ? (
            <p className="analises-empty-msg">Nenhuma área com dados suficientes.</p>
          ) : (
            <ul className="priority-list">
              {analytics.reviewPriority.map((area) => {
                const s = analytics.byArea[area]
                if (!s || s.total === 0) return null
                const needPct = Math.round(((s.total - s.correct) / s.total) * 100)
                return (
                  <li key={area} className="priority-list-item">
                    <span className="material-symbols-outlined md-icon--warning">warning</span>
                    <div className="priority-list-body">
                      <span className="priority-list-area">{area}</span>
                      <span className="priority-list-pct">{needPct}% de necessidade</span>
                    </div>
                    <SparkBar pct={100 - needPct} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Slide 5 — Pode relaxar */}
        <div className="analises-slide" data-testid="slide-relaxar">
          <h3 className="analises-section-title">Pode relaxar</h3>
          {analytics.canRelax.length === 0 ? (
            <div className="analises-empty-state">
              <span className="material-symbols-outlined analises-empty-icon">sentiment_satisfied</span>
              <p className="analises-empty-msg">
                Ainda nenhuma área com certeza ≥ 70% e acurácia ≥ 80%.<br/>Continue praticando!
              </p>
            </div>
          ) : (
            <ul className="priority-list">
              {analytics.canRelax.map((area) => {
                const s = analytics.byArea[area]
                return (
                  <li key={area} className="priority-list-item priority-list-item--safe">
                    <span className="material-symbols-outlined md-icon--green">check_circle</span>
                    <div className="priority-list-body">
                      <span className="priority-list-area">{area}</span>
                      <span className="priority-list-pct">{s?.pct ?? 0}% de acerto</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>

      {/* Dots navigation */}
      <div className="analises-dots" aria-label="Navegação do carrossel">
        {SLIDES.map((label, i) => (
          <button
            key={label}
            className={`analises-dot${activeSlide === i ? ' analises-dot--active' : ''}`}
            onClick={() => goToSlide(i)}
            aria-label={label}
            title={label}
          />
        ))}
      </div>
    </div>
  )
}
