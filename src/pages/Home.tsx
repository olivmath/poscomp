import { useRef, useState, useEffect } from 'react'
import { useResults } from '../hooks/useResults'
import type { Area } from '../types'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']
const SLIDES = ['Geral', 'Desempenho', 'Calibração', 'Análises', 'Progresso'] as const
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function pctColorClass(pct: number) {
  return pct >= 80 ? 'stat--high' : pct >= 60 ? 'stat--mid' : 'stat--low'
}

function SparkBar({ pct, invert }: { pct: number; invert?: boolean }) {
  const colorPct = invert ? 100 - pct : pct
  const cls = colorPct >= 80 ? 'spark-bar-fill--high' : colorPct >= 60 ? 'spark-bar-fill--mid' : 'spark-bar-fill--low'
  return (
    <div className="spark-bar-bg spark-bar-bg--full">
      <div className={`spark-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function smoothBezier(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0][0]},${pts[0][1]}` : ''
  const parts = [`M ${pts[0][0]},${pts[0][1]}`]
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x1 - x0) / 2.8
    parts.push(`C ${x0 + cx},${y0} ${x1 - cx},${y1} ${x1},${y1}`)
  }
  return parts.join(' ')
}

function ProgressChart({ scores }: { scores: Array<{ score: number; total: number; date: Date }> }) {
  if (scores.length < 2) {
    return (
      <div className="prog-empty">
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
  const older  = chronological.filter(s => s.date.getTime() < sevenDaysAgo)
  let tendencia: number | null = null
  if (recent.length > 0 && older.length > 0) {
    const avg = (arr: typeof recent) =>
      Math.round(arr.reduce((a, r) => a + Math.round((r.score / r.total) * 100), 0) / arr.length)
    tendencia = avg(recent) - avg(older)
  }

  const W = 300, H = 130
  const PAD = { top: 28, right: 14, bottom: 22, left: 14 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const toX = (i: number) => PAD.left + (pcts.length > 1 ? (i / (pcts.length - 1)) * chartW : chartW / 2)
  const toY = (v: number) => PAD.top + chartH - ((v - 30) / 70) * chartH // escala 30-100

  const pts: [number, number][] = pcts.map((p, i) => [toX(i), toY(Math.max(30, Math.min(100, p)))])
  const linePath = smoothBezier(pts)
  const areaPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1][0]},${PAD.top + chartH} L ${pts[0][0]},${PAD.top + chartH} Z`
    : ''
  const refY = toY(70)

  return (
    <div className="prog-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="prog-svg">
        <defs>
          <linearGradient id="progFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--md-sys-color-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* linha de referência 70% */}
        <line x1={PAD.left} y1={refY} x2={W - PAD.right} y2={refY}
          stroke="var(--color-divider)" strokeWidth="1" strokeDasharray="3 4" />
        <text x={PAD.left + 2} y={refY - 4} fontSize="8"
          fill="var(--md-sys-color-outline)">70%</text>

        {/* área preenchida */}
        <path d={areaPath} fill="url(#progFill)" />

        {/* linha suave */}
        <path d={linePath} fill="none" stroke="var(--md-sys-color-primary)"
          strokeWidth="2.5" strokeLinecap="round" />

        {/* pontos + labels */}
        {pts.map(([x, y], i) => (
          <g key={i}>
            <text x={x} y={y - 9} textAnchor="middle" fontSize="9" fontWeight="700"
              fill="var(--md-sys-color-primary)">{pcts[i]}%</text>
            <circle cx={x} cy={y} r="5"
              fill="var(--color-card-bg)" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" />
            <text x={x} y={H - 4} textAnchor="middle" fontSize="8"
              fill="var(--md-sys-color-on-surface-variant)">S{i + 1}</text>
          </g>
        ))}
      </svg>

      {/* footer stat */}
      <div className="prog-footer">
        <div className="prog-stat">
          <span className="prog-stat-label">Último simulado</span>
          <span className="prog-stat-value">{latest}%</span>
        </div>
        {tendencia !== null && (
          <div className={`prog-trend ${tendencia >= 0 ? 'prog-trend--up' : 'prog-trend--down'}`}>
            <span className="prog-trend-num">{tendencia >= 0 ? '+' : ''}{tendencia}%</span>
            <span className="prog-trend-label">últimos 7 dias</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function Home() {
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

  const totalAnswered = AREAS.reduce((sum, area) => sum + (analytics?.byArea[area]?.total ?? 0), 0)

  // últimos 7 dias em ordem cronológica (mais antigo → hoje)
  const today = new Date().toISOString().split('T')[0]
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const activeDays = analytics?.activeDaysThisWeek ?? []

  return (
    <div className="home-container home-container--dashboard">

      {/* ── Header: quadradinhos de dias da semana ── */}
      <header className="home-header">
        <div className="home-week-grid">
          {last7.map(dateStr => {
            const dow = new Date(dateStr + 'T12:00:00').getDay()
            const isActive = activeDays.includes(dateStr)
            const isToday = dateStr === today
            return (
              <div
                key={dateStr}
                className={[
                  'home-day-sq',
                  isActive ? 'home-day-sq--active' : '',
                  isToday  ? 'home-day-sq--today'  : '',
                ].join(' ')}
              >
                <span className="home-day-label">{DAY_LABELS[dow]}</span>
              </div>
            )
          })}
        </div>
        <p className="home-streak-label">
          🔥 {analytics?.streak ?? 0} dias seguidos
        </p>
      </header>

      {/* ── Carrossel de Análises ── */}
      <section className="home-analises">
        <div className="home-analises-dots-row">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`analises-dot ${activeSlide === i ? 'analises-dot--active' : ''}`}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>

        <div className="analises-carousel-wrap">
          <div className="analises-carousel" ref={carouselRef}>
            {!analytics ? (
              <div className="analises-slide analises-slide--empty">
                {analyticsLoading
                  ? <p>Carregando análises...</p>
                  : <p>Faça seu primeiro simulado para ver suas análises aqui!</p>
                }
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
                        <span className="geral-highlight-label">Forte</span>
                        <div className="geral-highlight-body">
                          <span className="geral-highlight-area">{analytics.bestArea}</span>
                          <span className="geral-highlight-pct stat--high">
                            {analytics.byArea[analytics.bestArea]?.pct ?? 0}%
                          </span>
                        </div>
                      </div>
                    )}
                    {analytics.worstArea && (
                      <div className="geral-highlight-item geral-highlight--fraco">
                        <span className="geral-highlight-label">Revisar</span>
                        <div className="geral-highlight-body">
                          <span className="geral-highlight-area">{analytics.worstArea}</span>
                          <span className="geral-highlight-pct stat--low">
                            {analytics.byArea[analytics.worstArea]?.pct ?? 0}%
                          </span>
                        </div>
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
                              <span className={`analises-area-stats ${pctColorClass(s.pct)}`}>{s.pct}%</span>
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
                      { label: 'Devia saber e acertei', pct: analytics.confidenceStats.certainAccuracy,       invert: false },
                      { label: 'Devia saber e errei',   pct: 100 - analytics.confidenceStats.certainAccuracy, invert: true  },
                      { label: 'Não sei e acertei',     pct: analytics.confidenceStats.unsureAccuracy,        invert: false },
                      { label: 'Não sei e errei',       pct: 100 - analytics.confidenceStats.unsureAccuracy,  invert: true  },
                    ].map(({ label, pct, invert }) => (
                      <div key={label} className="analises-area-row">
                        <div className="analises-area-header">
                          <span className="analises-area-name">{label}</span>
                          <span className={`analises-area-stats ${pctColorClass(invert ? 100 - pct : pct)}`}>{pct}%</span>
                        </div>
                        <SparkBar pct={pct} invert={invert} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slide 4 — Análises */}
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
                                  <span className={`analises-area-stats ${pctColorClass(s.pct)}`}>{s.pct}%</span>
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
                          analytics.canRelax.map(area => {
                            const pct = analytics.byArea[area]?.pct ?? 0
                            return (
                              <div key={area} className="analises-area-row">
                                <div className="analises-area-header">
                                  <span className="analises-area-name">{area}</span>
                                  <span className={`analises-area-stats ${pctColorClass(pct)}`}>{pct}%</span>
                                </div>
                                <SparkBar pct={pct} />
                              </div>
                            )
                          })
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
