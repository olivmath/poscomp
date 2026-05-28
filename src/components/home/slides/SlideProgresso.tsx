import type { Analytics } from '../../../hooks/useResults'
import { ProgressChart } from '../ProgressChart'

interface SlideProgressoProps {
  analytics: Analytics
}

export function SlideProgresso({ analytics }: SlideProgressoProps) {
  return (
    <div className="analises-slide">
      <h3 className="analises-section-title">Progresso</h3>
      <ProgressChart scores={analytics.recentScores} />
    </div>
  )
}
