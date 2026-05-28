import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useResults } from '../hooks/useResults'
import type { Area } from '../types'

const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']
const SLIDES = ['Geral', 'Desempenho', 'Calibração', 'Análises', 'Progresso'] as const

function SparkBar({ pct, invert }: { pct: number; invert?: boolean }) {
  const colorPct = invert ? 100 - pct : pct
  const cls = colorPct >= 80 ? 'spark-bar-fill--high' : colorPct >= 60 ? 'spark-bar-fill--mid' : 'spark-bar-fill--low'
  return (
    <div className="spark-bar-bg spark-bar-bg--full">
      <div className={`spark-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ProgressChart({ scores }: { scores: Array<{ score: number; total: number; date: Date }> }) {
  if (scores.length < 2) {
    return (
      <div className="progress-chart-empty">
        <p>Realize mais simulados para ver o progresso.</p>
      </div>
    )
  }

  const chronological = [...scores].reverse()
  const pcts = chronological.map(s => Math.round((s.score / s.total) * 100))
  const latest = pcts[pcts.length - 1]

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 86400000
  const recent = chronological.filter(s => s.date.getTime() >= sevenDaysAgo)
  const older = chronological.filter(s => s.date.getTime() < sevenDaysAgo)

  let tendencia: number | null = null
  if (recent.length > 0 && older.length > 0) {
    const avgRecent = Math.round(recent.reduce((acc, r) => acc + Math.round((r.score / r.total) * 100), 0) / recent.length)
    const avgOlder = Math.round(older.reduce((acc, r) => acc + Math.round((r.score / r.total) * 100), 0) / older.length)
    tendencia = avgRecent - avgOlder
  }

  const W = 280, H = 120
  const PAD = { top: 10, right: 16, bottom: 24, left: 36 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const toX = (i: number) => PAD.left + (pcts.length > 1 ? (i / (pcts.length - 1)) * chartW : chartW / 2)
  const toY = (v: number) => PAD.top + chartH - (v / 100) * chartH

  const points = pcts.map((p, i) => `${toX(i)},${toY(p)}`).join(' ')
  const gridLines = [40, 60, 80, 100]

  return (
    <div className="progress-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="progress-chart-svg">
        {gridLines.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={toY(v)}
              x2={W - PAD.right} y2={toY(v)}
              stroke="var(--color-divider-subtle)" strokeWidth="1"
            />
            <text
              x={PAD.left - 4} y={toY(v) + 4}
              textAnchor="end" fontSize="9"
              fill="var(--md-sys-color-on-surface-variant)"
            >
              {v}%
            </text>
          </g>
        ))}
        <polyline
          points={points}
          fill="none"
          stroke="var(--md-sys-color-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pcts.map((p, i) => (
          <circle
            key={i} cx={toX(i)} cy={toY(p)} r="4"
            fill="var(--md-sys-color-primary)"
            stroke="var(--color-card-bg)" strokeWidth="2"
          />
        ))}
        {pcts.map((_, i) => (
          <text
            key={i} x={toX(i)} y={H - 4}
            textAnchor="middle" fontSize="9"
            fill="var(--md-sys-color-on-surface-variant)"
          >
            S{i + 1}
          </text>
        ))}
      </svg>

      <div className="progress-chart-footer">
        <span className="progress-latest">
          Último simulado: <strong>{latest}%</strong>
        </span>
        {tendencia !== null && (
          <span className={`progress-trend ${tendencia >= 0 ? 'trend--up' : 'trend--down'}`}>
            Tendência: {tendencia >= 0 ? '+' : ''}{tendencia}% nos últimos 7 dias
          </span>
        )}
      </div>
    </div>
  )
}

export function Home() {
  const { user } = useAuth()
  const { analytics, loading: analyticsLoading } = useResults()

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

  const firstName = user?.displayName?.split(' ')[0]
  const freq = analytics?.weeklyFrequency ?? 0
  const freqClass = freq >= 80 ? 'high' : freq >= 50 ? 'mid' : 'low'
  const totalAnswered = AREAS.reduce((sum, area) => sum + (analytics?.byArea[area]?.total ?? 0), 0)

  return (
    <div className="home-container home-container--dashboard">
      {/* Header: greeting + freq bar inline */}
      <header className="home-header">
        <div className="home-header-row">
          <h1 className="home-greeting">Olá, {firstName}! 👋</h1>
          <div className="home-freq-inline">
            <div className="home-freq-track">
              <div className={`home-freq-fill ${freqClass}`} style={{ width: `${freq}%` }} />
            </div>
            <div className="home-freq-meta">
              <span>{freq}% da semana</span>
              <span>🔥 {analytics?.streak ?? 0} dias</span>
            </div>
          </div>
        </div>
      </header>

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
                  <p>Faça seu primeiro simulado para ver suas análises aqui!</p>
                )}
              </div>
            ) : (
              <>
                {/* Slide 1 — Geral */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Geral</h3>
                  <div className="geral-main-stat">
                    <span className="geral-pct">{analytics.overallAccuracy}%</span>
                    <span className="geral-detail">acertos · {totalAnswered} questões</span>
                  </div>
                  <div className="geral-highlights">
                    {analytics.bestArea && (
                      <div className="geral-highlight-item geral-highlight--forte">
                        <span className="geral-highlight-label">Forte:</span>
                        <span className="geral-highlight-area">{analytics.bestArea}</span>
                      </div>
                    )}
                    {analytics.worstArea && (
                      <div className="geral-highlight-item geral-highlight--fraco">
                        <span className="geral-highlight-label">Fraco:</span>
                        <span className="geral-highlight-area">{analytics.worstArea}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slide 2 — Desempenho (Por área) */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Por área</h3>
                  <div className="analises-area-list">
                    {AREAS
                      .filter(area => (analytics.byArea[area]?.total ?? 0) > 0)
                      .sort((a, b) => (analytics.byArea[b]?.pct ?? 0) - (analytics.byArea[a]?.pct ?? 0))
                      .map(area => {
                        const s = analytics.byArea[area]!
                        return (
                          <div key={area} className="analises-area-row">
                            <div className="analises-area-header">
                              <span className="analises-area-name">{area}</span>
                              <span className="analises-area-stats">{s.pct}%</span>
                            </div>
                            <SparkBar pct={s.pct} />
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Slide 3 — Calibração */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Calibração</h3>
                  <div className="analises-area-list">
                    {[
                      { label: 'Devia saber e acertei', pct: analytics.confidenceStats.certainAccuracy },
                      { label: 'Devia saber e errei',   pct: 100 - analytics.confidenceStats.certainAccuracy },
                      { label: 'Não sei e acertei',        pct: analytics.confidenceStats.unsureAccuracy },
                      { label: 'Não sei e errei',          pct: 100 - analytics.confidenceStats.unsureAccuracy },
                    ].map(({ label, pct }) => (
                      <div key={label} className="analises-area-row">
                        <div className="analises-area-header">
                          <span className="analises-area-name">{label}</span>
                          <span className="analises-area-stats">{pct}%</span>
                        </div>
                        <SparkBar pct={pct} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slide 4 — Análises: Precisa revisar + Estudo completo */}
                <div className="analises-slide">
                  <div className="analises-dual-section">
                    <div>
                      <h3 className="analises-section-title">Precisa revisar</h3>
                      <div className="analises-area-list">
                        {analytics.reviewPriority
                          .filter(area => (analytics.byArea[area]?.pct ?? 100) < 80)
                          .slice(0, 3)
                          .map(area => {
                            const s = analytics.byArea[area]!
                            return (
                              <div key={area} className="analises-area-row">
                                <div className="analises-area-header">
                                  <span className="analises-area-name">{area}</span>
                                  <span className="analises-area-stats">{s.pct}%</span>
                                </div>
                                <SparkBar pct={s.pct} />
                              </div>
                            )
                          })}
                        {analytics.reviewPriority.filter(a => (analytics.byArea[a]?.pct ?? 100) < 80).length === 0 && (
                          <p className="analises-empty-msg">Nenhuma área crítica 🎉</p>
                        )}
                      </div>
                    </div>

                    <div className="analises-section-divider" />

                    <div>
                      <h3 className="analises-section-title">Estudo completo</h3>
                      <div className="analises-area-list">
                        {analytics.canRelax.length > 0 ? (
                          analytics.canRelax.map(area => (
                            <div key={area} className="analises-area-row">
                              <div className="analises-area-header">
                                <span className="analises-area-name">{area}</span>
                                <span className="analises-area-stats">{analytics.byArea[area]?.pct ?? 0}%</span>
                              </div>
                              <SparkBar pct={analytics.byArea[area]?.pct ?? 0} />
                            </div>
                          ))
                        ) : (
                          <p className="analises-empty-msg">Continue praticando!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 5 — Progresso */}
                <div className="analises-slide">
                  <h3 className="analises-section-title">Progresso</h3>
                  <ProgressChart scores={analytics.recentScores} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
