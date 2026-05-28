import type { Analytics } from '../../../hooks/useResults'
import type { Area } from '../../../types'
import { SparkBar } from '../SparkBar'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']

interface SlideDesempenhoProps {
  analytics: Analytics
}

function pctColorClass(pct: number) {
  return pct >= 80 ? 'stat--high' : pct >= 60 ? 'stat--mid' : 'stat--low'
}

export function SlideDesempenho({ analytics }: SlideDesempenhoProps) {
  const areasWithData = AREAS
    .filter(area => (analytics.byArea[area]?.total ?? 0) > 0)
    .sort((a, b) => (analytics.byArea[b]?.pct ?? 0) - (analytics.byArea[a]?.pct ?? 0))

  return (
    <div className="analises-slide">
      <h3 className="analises-section-title">Por área</h3>
      <div className="analises-area-list">
        {areasWithData.map(area => {
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
      </div>
    </div>
  )
}
