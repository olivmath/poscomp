import type { Analytics } from '../../hooks/useResults'
import type { Area } from '../../types'

const AREA_SHORT: Partial<Record<Area, string>> = {
  'Matemática': 'Matemática',
  'Fundamentos da Computação': 'Fundamentos',
  'Tecnologia da Computação': 'Tecnologia',
}

interface PerformancePanelProps {
  analytics: Analytics | null
  loading: boolean
}

export function AnalysisCarousel({ analytics, loading }: PerformancePanelProps) {
  if (!analytics) {
    return (
      <div className="perf-empty">
        <span className="material-symbols-outlined perf-empty__icon" aria-hidden="true">
          {loading ? 'hourglass_empty' : 'bar_chart'}
        </span>
        <p className="perf-empty__text">
          {loading
            ? 'Carregando…'
            : 'Faça seu primeiro simulado para ver suas análises aqui.'}
        </p>
      </div>
    )
  }

  const areas = (Object.entries(analytics.byArea) as [Area, { pct: number; correct: number; total: number }][])
  const scores = [...analytics.recentScores].reverse()

  return (
    <div className="perf-panel">
      <section className="perf-section">
        <h3 className="perf-section__title">Geral</h3>
        {scores.length < 2 ? (
          <p className="perf-chart-empty">Realize mais simulados para ver o progresso.</p>
        ) : (
          <LineChart scores={scores} />
        )}
      </section>

            <section className="perf-section">
        <h3 className="perf-section__title">Individual</h3>
        <div className="perf-area-list">
          {areas.map(([area, stats]) => {
            const pct = stats?.pct ?? 0
            const colorClass = pct >= 70 ? 'perf-fill--high' : pct >= 50 ? 'perf-fill--mid' : 'perf-fill--low'
            return (
              <div key={area} className="perf-area-row">
                <span className="perf-area-name">{AREA_SHORT[area] ?? area}</span>
                <div className="perf-area-track">
                  <div className={`perf-area-fill ${colorClass}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="perf-area-pct">{pct}%</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ── LineChart ────────────────────────────────────────────────────────────────

interface ScoreEntry { score: number; total: number; date: Date }

function LineChart({ scores }: { scores: ScoreEntry[] }) {
  const W = 280, H = 110
  const PAD = { top: 16, right: 12, bottom: 28, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const pcts = scores.map(s => Math.round((s.score / s.total) * 100))
  const toX = (i: number) => PAD.left + (pcts.length > 1 ? (i / (pcts.length - 1)) * chartW : chartW / 2)
  const toY = (v: number) => PAD.top + chartH - (v / 100) * chartH

  const pts: [number, number][] = pcts.map((p, i) => [toX(i), toY(Math.max(0, Math.min(100, p)))])
  const linePath = smoothLine(pts)

  const yTicks = [0, 50, 100]
  const xLabels = pcts.map((_, i) => `T${i + 1}`)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="perf-line-svg"
      role="img"
      aria-label="Taxa de acerto por simulado"
    >
      {/* Grid lines + Y labels */}
      {yTicks.map(v => {
        const y = toY(v)
        return (
          <g key={v}>
            <line
              x1={PAD.left} y1={y}
              x2={W - PAD.right} y2={y}
              stroke="var(--color-divider)"
              strokeWidth="0.8"
              strokeDasharray={v === 0 ? 'none' : '3 4'}
            />
            <text
              x={PAD.left - 5} y={y + 4}
              textAnchor="end"
              fontSize="8"
              fill="var(--md-sys-color-outline)"
              fontFamily="inherit"
            >
              {v}%
            </text>
          </g>
        )
      })}

      {/* X labels */}
      {xLabels.map((label, i) => {
        const x = toX(i)
        return (
          <text
            key={i}
            x={x}
            y={H - 6}
            textAnchor="middle"
            fontSize="8"
            fill="var(--md-sys-color-outline)"
            fontFamily="inherit"
          >
            {label}
          </text>
        )
      })}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--md-sys-color-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {pts.map(([x, y], i) => {
        const isLast = i === pts.length - 1
        return (
          <g key={i}>
            <circle
              cx={x} cy={y}
              r={isLast ? 4 : 2.5}
              fill="var(--color-card-bg)"
              stroke="var(--md-sys-color-primary)"
              strokeWidth={isLast ? 2 : 1.5}
            />
            {isLast && (
              <text
                x={x} y={y - 8}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="var(--md-sys-color-primary)"
                fontFamily="inherit"
              >
                {pcts[i]}%
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function smoothLine(pts: [number, number][]): string {
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
