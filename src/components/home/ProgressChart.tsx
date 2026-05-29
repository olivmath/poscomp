interface ScoreEntry {
  score: number
  total: number
  date: Date
}

interface ProgressChartProps {
  scores: ScoreEntry[]
}

export function ProgressChart({ scores }: ProgressChartProps) {
  if (scores.length < 2) {
    return (
      <div className="prog-empty">
        <p>Realize mais simulados para ver o progresso.</p>
      </div>
    )
  }

  const { pcts, latest, tendencia } = buildChartData(scores)
  const { linePath, areaPath, pts, refY, W, H, PAD } = buildSvgPaths(pcts)

  const lastIdx = pts.length - 1

  return (
    <div className="prog-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="prog-svg">
        <defs>
          <linearGradient id="progFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--md-sys-color-primary)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0"    />
          </linearGradient>
        </defs>

        <line
          x1={PAD.left} y1={refY} x2={W - PAD.right} y2={refY}
          stroke="var(--color-divider)" strokeWidth="1" strokeDasharray="3 4"
        />

        <path d={areaPath} fill="url(#progFill)" />
        <path d={linePath} fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" strokeLinecap="round" />

        {pts.map(([x, y], i) => (
          <g key={i}>
            {i === lastIdx && (
              <text x={x} y={y - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--md-sys-color-primary)">
                {pcts[i]}%
              </text>
            )}
            <circle cx={x} cy={y} r={i === lastIdx ? 4 : 3} fill="var(--color-card-bg)" stroke="var(--md-sys-color-primary)" strokeWidth={i === lastIdx ? 2 : 1.5} />
          </g>
        ))}
      </svg>

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

/// AUX FUNCTIONS

function buildChartData(scores: ScoreEntry[]) {
  const chronological = [...scores].reverse()
  const pcts = chronological.map(s => Math.round((s.score / s.total) * 100))
  const latest = pcts[pcts.length - 1]

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 86400000
  const recent = chronological.filter(s => s.date.getTime() >= sevenDaysAgo)
  const older  = chronological.filter(s => s.date.getTime() < sevenDaysAgo)
  let tendencia: number | null = null
  if (recent.length > 0 && older.length > 0) {
    const avg = (arr: ScoreEntry[]) =>
      Math.round(arr.reduce((a, r) => a + Math.round((r.score / r.total) * 100), 0) / arr.length)
    tendencia = avg(recent) - avg(older)
  }

  return { pcts, latest, tendencia }
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

function buildSvgPaths(pcts: number[]) {
  const W = 300, H = 140
  const PAD = { top: 20, right: 14, bottom: 16, left: 14 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const toX = (i: number) => PAD.left + (pcts.length > 1 ? (i / (pcts.length - 1)) * chartW : chartW / 2)
  const toY = (v: number) => PAD.top + chartH - ((v - 30) / 70) * chartH

  const pts: [number, number][] = pcts.map((p, i) => [toX(i), toY(Math.max(30, Math.min(100, p)))])
  const linePath = smoothBezier(pts)
  const areaPath = pts.length >= 2
    ? `${linePath} L ${pts[pts.length - 1][0]},${PAD.top + chartH} L ${pts[0][0]},${PAD.top + chartH} Z`
    : ''
  const refY = toY(70)

  return { linePath, areaPath, pts, refY, W, H, PAD }
}
