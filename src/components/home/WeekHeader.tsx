import '@material/web/progress/linear-progress.js'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface WeekHeaderProps {
  activeDays: string[]
  streak: number
}

export function WeekHeader({ activeDays, streak }: WeekHeaderProps) {
  const today = new Date().toISOString().split('T')[0]
  const last7 = buildLast7Days()
  const activeDaysCount = last7.filter(d => activeDays.includes(d)).length
  const freqPct = activeDaysCount / 7

  return (
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
              ].filter(Boolean).join(' ')}
              aria-label={`${DAY_LABELS[dow]}${isActive ? ' — ativo' : ''}${isToday ? ' — hoje' : ''}`}
            >
              <span className="home-day-label">{DAY_LABELS[dow]}</span>
            </div>
          )
        })}
      </div>

      <div className="home-freq-row">
        <md-linear-progress
          value={freqPct}
          className="home-freq-progress"
          aria-label={`Frequência semanal: ${activeDaysCount} de 7 dias`}
          style={{
            '--md-linear-progress-track-color': 'var(--color-spark-bg)',
            '--md-linear-progress-active-indicator-color': freqProgressColor(freqPct),
            '--md-linear-progress-track-height': '6px',
            '--md-linear-progress-active-indicator-height': '6px',
            '--md-linear-progress-track-shape': '3px',
          } as React.CSSProperties}
        />
        <p className="home-streak-label">
          🔥 {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
        </p>
      </div>
    </header>
  )
}

/// AUX FUNCTIONS

function buildLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function freqProgressColor(pct: number): string {
  if (pct >= 0.8) return 'var(--color-score-high)'
  if (pct >= 0.5) return 'var(--color-score-mid)'
  return 'var(--color-score-low)'
}
