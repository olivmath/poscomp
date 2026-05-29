import type { Analytics } from '../../../hooks/useResults'

interface SlideGeralProps {
  analytics: Analytics
}

export function SlideGeral({ analytics }: SlideGeralProps) {
  return (
    <div className="analises-slide">
      <h3 className="analises-section-title">Geral</h3>

      <div className="geral-main-stat">
        <span className="geral-pct">{analytics.overallAccuracy}%</span>
        <span className="geral-detail">
          acertos · {totalAnswered(analytics)} questões
        </span>
      </div>
    </div>
  )
}

/// AUX FUNCTIONS

function totalAnswered(analytics: Analytics): number {
  return Object.values(analytics.byArea).reduce((sum, a) => sum + (a?.total ?? 0), 0)
}
