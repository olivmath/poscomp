import type { Analytics } from '../../../hooks/useResults'
import { SparkBar } from '../SparkBar'

interface SlideAnalisesProps {
  analytics: Analytics
}

function pctColorClass(pct: number) {
  return pct >= 80 ? 'stat--high' : pct >= 60 ? 'stat--mid' : 'stat--low'
}

export function SlideAnalises({ analytics }: SlideAnalisesProps) {
  const needsReview = analytics.reviewPriority.filter(
    area => (analytics.byArea[area]?.pct ?? 100) < 80
  )

  return (
    <div className="analises-slide">
      <div className="analises-dual-section">
        <div>
          <h3 className="analises-section-title">Precisa revisar</h3>
          <div className="analises-area-list">
            {needsReview.slice(0, 3).map(area => {
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
            {needsReview.length === 0 && (
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
  )
}
