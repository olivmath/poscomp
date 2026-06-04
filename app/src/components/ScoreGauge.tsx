interface ScoreGaugeProps {
  score: number
  total: number
}

export function ScoreGauge({ score, total }: ScoreGaugeProps) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const color = pct >= 70 ? 'var(--color-score-high)' : pct >= 50 ? 'var(--color-score-mid)' : 'var(--color-score-low)'
  const bg = pct >= 70 ? 'var(--color-score-high-bg)' : pct >= 50 ? 'var(--color-score-mid-bg)' : 'var(--color-score-low-bg)'

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={radius} fill={bg} stroke="var(--color-divider)" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, color }}>{pct}%</span>
          <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {score}/{total}
          </span>
        </div>
      </div>
    </div>
  )
}
