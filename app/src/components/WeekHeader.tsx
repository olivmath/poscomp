const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface WeekHeaderProps {
  activeDays: string[]
  streak: number
  loading?: boolean
}

export function WeekHeader({ activeDays, streak, loading }: WeekHeaderProps) {
  const activeSet = new Set(activeDays)
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return { date: d.toISOString().split('T')[0], label: DAYS[d.getDay()], isToday: i === 6 }
  })

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: 80 }} />
      </div>
    )
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--color-streak)', fontSize: 20 }}>
          local_fire_department
        </span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {days.map(({ date, label, isToday }) => {
          const active = activeSet.has(date)
          return (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: active
                    ? 'var(--md-sys-color-primary)'
                    : 'var(--md-sys-color-surface-container-highest)',
                  border: isToday ? '2px solid var(--md-sys-color-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'white' }}>
                    check
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
