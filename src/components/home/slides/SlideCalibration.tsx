import type { Analytics } from '../../../hooks/useResults'
import { SparkBar } from '../SparkBar'

interface SlideCalibrationProps {
  analytics: Analytics
}

function pctColorClass(pct: number) {
  return pct >= 80 ? 'stat--high' : pct >= 60 ? 'stat--mid' : 'stat--low'
}

export function SlideCalibration({ analytics }: SlideCalibrationProps) {
  const rows = [
    { label: 'Devia saber e acertei', pct: analytics.confidenceStats.certainAccuracy,       invert: false },
    { label: 'Devia saber e errei',   pct: 100 - analytics.confidenceStats.certainAccuracy,  invert: true  },
    { label: 'Não sei e acertei',     pct: analytics.confidenceStats.unsureAccuracy,          invert: false },
    { label: 'Não sei e errei',       pct: 100 - analytics.confidenceStats.unsureAccuracy,    invert: true  },
  ]

  return (
    <div className="analises-slide">
      <h3 className="analises-section-title">Calibração</h3>
      <div className="analises-area-list">
        {rows.map(({ label, pct, invert }) => (
          <div key={label} className="analises-area-row">
            <div className="analises-area-header">
              <span className="analises-area-name">{label}</span>
              <span className={`analises-area-stats ${pctColorClass(invert ? 100 - pct : pct)}`}>{pct}%</span>
            </div>
            <SparkBar pct={pct} invert={invert} />
          </div>
        ))}
      </div>
    </div>
  )
}
