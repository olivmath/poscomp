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
  )
}

/// AUX FUNCTIONS

function totalAnswered(analytics: Analytics): number {
  return Object.values(analytics.byArea).reduce((sum, a) => sum + (a?.total ?? 0), 0)
}
