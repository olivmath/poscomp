import '@material/web/button/filled-button.js'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSrs } from '../hooks/useSrs'
import { useResults } from '../hooks/useResults'
import type { Area } from '../types'

const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']
const SLIDES = ['Geral', 'Calibração', 'Heatmap', 'Revisar', 'Relaxar'] as const

function SparkBar({ pct, invert }: { pct: number; invert?: boolean }) {
  const colorPct = invert ? 100 - pct : pct
  const cls = colorPct >= 80 ? 'spark-bar-fill--high' : colorPct >= 60 ? 'spark-bar-fill--mid' : 'spark-bar-fill--low'
  return (
    <div className="spark-bar-bg spark-bar-bg--full">
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
            <div key={i} className="timeline-bar-col">
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

export function Home() {
  const { user } = useAuth()
  const { totalPending } = useSrs()
  const { analytics, loading: analyticsLoading } = useResults()
  const navigate = useNavigate()
  
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return

    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActiveSlide(idx)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [analytics])

  const goToSlide = (idx: number) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setActiveSlide(idx)
  }

  return (
    <div className="home-container home-container--dashboard">
      {/* Header with Greeting & Frequência */}
      <header className="home-header">
        <div className="home-greeting-row">
          <h1 className="home-greeting">Olá, {user?.displayName?.split(' ')[0]}! 👋</h1>
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="home-header-avatar" />
          )}
        </div>
        
        <div className="home-frequency-bar">
          <div className="home-freq-track">
            <div 
              className={`home-freq-fill ${analytics && analytics.weeklyFrequency >= 80 ? 'high' : analytics && analytics.weeklyFrequency >= 50 ? 'mid' : 'low'}`}
              style={{ width: `${analytics?.weeklyFrequency ?? 0}%` }}
            />
          </div>
          <div className="home-freq-labels">
            <span className="home-freq-pct">{analytics?.weeklyFrequency ?? 0}% da semana</span>
            <span className="home-freq-streak">🔥 {analytics?.streak ?? 0} dias seguidos</span>
          </div>
        </div>
      </header>

      {/* Banner de Revisão */}
      {totalPending > 0 && (
        <section className="home-revisao-banner" onClick={() => navigate('/revisao')}>
          <div className="home-revisao-banner-content">
            <span className="material-symbols-outlined home-revisao-icon">psychology</span>
            <div className="home-revisao-banner-text">
              <span className="home-revisao-count">{totalPending} questões para revisar</span>
              <span className="home-revisao-cta">Revisar agora →</span>
            </div>
          </div>
        </section>
      )}

      {/* Carrossel de Análises */}
      <section className="home-analises">
        <div className="home-analises-header">
          <h2 className="home-analises-title">ANÁLISES</h2>
          <div className="home-analises-dots">
            {SLIDES.map((_, i) => (
              <button 
                key={i} 
                className={`analises-dot ${activeSlide === i ? 'analises-dot--active' : ''}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </div>

        <div className="analises-carousel-wrap">
          <div className="analises-carousel" ref={carouselRef}>
            {!analytics ? (
              <div className="analises-slide analises-slide--empty">
                {analyticsLoading ? (
                  <p>Carregando análises...</p>
                ) : (
                  <>
                    <p>Faça seu primeiro simulado para ver suas análises aqui!</p>
                    <md-filled-button onClick={() => navigate('/simulado')}>
                      Começar Simulado
                    </md-filled-button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Slide 1 — Geral */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Geral</h3>
                  <div className="analises-stat-row">
                    <div className="analises-stat-chip">
                      <span className="analises-stat-value">{analytics.overallAccuracy}%</span>
                      <span className="analises-stat-label">acurácia</span>
                    </div>
                    <div className="analises-stat-chip">
                      <span className="analises-stat-value">{analytics.totalSimulados}</span>
                      <span className="analises-stat-label">simulados</span>
                    </div>
                  </div>
                  <ScoreTimeline scores={analytics.recentScores} />
                </div>

                {/* Slide 2 — Calibração */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Calibração</h3>
                  <div className="analises-calibration-cards">
                    <div className="analises-cal-card certain">
                      <span className="analises-cal-label">Certeza e Acerto</span>
                      <span className="analises-cal-value">{analytics.confidenceStats.certainAccuracy}%</span>
                    </div>
                    <div className="analises-cal-card unsure">
                      <span className="analises-cal-label">Dúvida e Acerto</span>
                      <span className="analises-cal-value">{analytics.confidenceStats.unsureAccuracy}%</span>
                    </div>
                  </div>
                </div>

                {/* Slide 3 — Heatmap */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Por área</h3>
                  <div className="analises-area-list">
                    {AREAS.map(area => {
                      const s = analytics.byArea[area]
                      if (!s || s.total === 0) return null
                      return (
                        <div key={area} className="analises-area-row">
                          <div className="analises-area-header">
                            <span className="analises-area-name">{area}</span>
                            <span className="analises-area-pct">{s.pct}%</span>
                          </div>
                          <SparkBar pct={s.pct} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Slide 4 — Revisar */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Precisa revisar</h3>
                  <ul className="priority-list">
                    {analytics.reviewPriority.slice(0, 3).map(area => {
                      const s = analytics.byArea[area]
                      return (
                        <li key={area} className="priority-list-item">
                          <span className="priority-list-area">{area}</span>
                          <SparkBar pct={s?.pct ?? 0} invert />
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Slide 5 — Relaxar */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Pode relaxar ✅</h3>
                  <ul className="priority-list">
                    {analytics.canRelax.length > 0 ? (
                      analytics.canRelax.map(area => (
                        <li key={area} className="priority-list-item safe">
                          <span className="priority-list-area">{area}</span>
                          <SparkBar pct={analytics.byArea[area]?.pct ?? 0} />
                        </li>
                      ))
                    ) : (
                      <p className="analises-empty-msg">Continue praticando!</p>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Primary Action if no pending reviews */}
      {totalPending === 0 && (
        <div className="home-actions-main">
          <md-filled-button 
            className="btn-hero"
            onClick={() => navigate('/simulado')}
          >
            Fazer Novo Simulado
          </md-filled-button>
        </div>
      )}
    </div>
  )
}
