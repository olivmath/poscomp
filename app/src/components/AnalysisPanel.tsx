import { HistoricoResult } from '../types'

interface AnalysisPanelProps {
  results: HistoricoResult[]
  loading?: boolean
}

export function AnalysisPanel({ results, loading }: AnalysisPanelProps) {
  if (loading) {
    return (
      <div className="card section-stack">
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 60 }} />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="card page-placeholder" style={{ padding: 24 }}>
        <span className="material-symbols-outlined">bar_chart</span>
        <p style={{ margin: 0, fontSize: 14 }}>Faça seu primeiro simulado para ver o progresso.</p>
      </div>
    )
  }

  if (results.length < 2) {
    return (
      <div className="card page-placeholder" style={{ padding: 24 }}>
        <span className="material-symbols-outlined">bar_chart</span>
        <p style={{ margin: 0, fontSize: 14 }}>Realize mais simulados para ver o progresso.</p>
      </div>
    )
  }

  const byMateria: Record<string, { correct: number; total: number }> = {}
  for (const r of results) {
    for (const [m, stats] of Object.entries(r.materiaBreakdown)) {
      if (!byMateria[m]) byMateria[m] = { correct: 0, total: 0 }
      byMateria[m].correct += stats.correct
      byMateria[m].total += stats.total
    }
  }

  const last5 = results.slice(0, 5).reverse()
  const maxScore = Math.max(...last5.map((r) => r.totalQuestions), 1)
  const chartW = 240
  const chartH = 80
  const pts = last5.map((r, i) => {
    const x = (i / (last5.length - 1)) * chartW
    const y = chartH - (r.score / maxScore) * chartH
    return `${x},${y}`
  })

  return (
    <div className="card section-stack">
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Geral</p>
        <svg width={chartW} height={chartH} style={{ overflow: 'visible' }}>
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke="var(--md-sys-color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {last5.map((r, i) => {
            const x = (i / (last5.length - 1)) * chartW
            const y = chartH - (r.score / maxScore) * chartH
            return <circle key={i} cx={x} cy={y} r="4" fill="var(--md-sys-color-primary)" />
          })}
        </svg>
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Individual</p>
        {Object.entries(byMateria).map(([m, stats]) => {
          const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
          const color = pct >= 70 ? 'var(--color-score-high)' : pct >= 50 ? 'var(--color-score-mid)' : 'var(--color-score-low)'
          return (
            <div key={m} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{m}</span>
                <span style={{ color }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--md-sys-color-outline-variant)' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
