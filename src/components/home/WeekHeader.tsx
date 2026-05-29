import '@material/web/progress/linear-progress.js'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface WeekHeaderProps {
  activeDays: string[]
  streak: number
}

export function WeekHeader({ activeDays, streak }: WeekHeaderProps) {
  const today = new Date().toISOString().split('T')[0]
  const last7 = buildLast7Days()

  return (
    <header className="week-card">
      <div className="week-card__top">
        <span className="week-card__eyebrow">Frequência semanal</span>

        <div className="week-card__streak">
          <span
            className="material-symbols-outlined week-card__streak-icon"
            aria-hidden="true"
          >
            local_fire_department
          </span>
          <span className="week-card__streak-count">{streak}</span>
          <span className="week-card__streak-unit">
            {streak === 1 ? 'dia seguido' : 'dias seguidos'}
          </span>
        </div>
      </div>

      <div className="week-card__days" aria-label="Atividade dos últimos 7 dias">
        {last7.map(dateStr => {
          const dow = new Date(dateStr + 'T12:00:00').getDay()
          const isActive = activeDays.includes(dateStr)
          const isToday = dateStr === today
          return (
            <div
              key={dateStr}
              className={[
                'week-day',
                isActive ? 'week-day--active' : '',
                isToday  ? 'week-day--today'  : '',
              ].filter(Boolean).join(' ')}
              aria-label={`${DAY_LABELS[dow]}${isActive ? ' — ativo' : ''}${isToday ? ' — hoje' : ''}`}
            >
              <span className="week-day__label">{DAY_LABELS[dow]}</span>
            </div>
          )
        })}
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
