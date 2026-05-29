import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/chips/chip-set.js'
import '@material/web/chips/filter-chip.js'
import '@material/web/labs/segmentedbuttonset/outlined-segmented-button-set.js'
import '@material/web/labs/segmentedbutton/outlined-segmented-button.js'
import { useState } from 'react'
import type { Area, SimuladoConfig } from '../../types'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']

export function ConfigScreen({
  initialConfig,
  onStart,
  onBack,
  loading,
}: {
  initialConfig: SimuladoConfig
  onStart: (config: SimuladoConfig) => void
  onBack: () => void
  loading: boolean
}) {
  const [areas, setAreas] = useState<Area[]>(initialConfig.areas)
  const [totalQuestions, setTotalQuestions] = useState<number>(initialConfig.totalQuestions)
  const [timerMode, setTimerMode] = useState<'none' | 'per-question'>(initialConfig.timerMode)
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(initialConfig.secondsPerQuestion ?? 120)

  const toggleArea = (area: Area) =>
    setAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])

  const handleStart = () =>
    onStart({ areas, totalQuestions, timerMode, secondsPerQuestion: timerMode === 'per-question' ? secondsPerQuestion : undefined })

  return (
    <div className="simulado-container" data-testid="simulado-config">
      <div className="simulado-card">
        <h2 className="config-title">Configurar Simulado</h2>

        <div className="config-section config-section--full">
          <p className="config-label">Temas</p>
          <md-chip-set className="area-chips area-chips--mt">
            <md-filter-chip label="Todas" selected={areas.length === 0} onClick={() => setAreas([])} data-testid="chip-all" />
            {AREAS.map(area => (
              <md-filter-chip
                key={area}
                label={area}
                selected={areas.includes(area)}
                onClick={() => toggleArea(area)}
                data-testid={`chip-${area}`}
              />
            ))}
          </md-chip-set>
        </div>

        <div className="config-section config-section--full config-section--mt">
          <p className="config-label">Nº de questões</p>
          <md-outlined-segmented-button-set className="segmented-buttons--mt config-segmented">
            {[5, 10, 20, 0].map(val => (
              <md-outlined-segmented-button
                key={val}
                label={val === 0 ? 'Máximo' : String(val)}
                selected={totalQuestions === val}
                onClick={() => setTotalQuestions(val)}
                data-testid={`q-${val === 0 ? 'max' : val}`}
              />
            ))}
          </md-outlined-segmented-button-set>
        </div>

        <div className="config-section config-section--full config-section--mt">
          <p className="config-label">Tempo por questão</p>
          <md-outlined-segmented-button-set className="segmented-buttons--mt config-segmented">
            <md-outlined-segmented-button label="Sem limite" selected={timerMode === 'none'} onClick={() => setTimerMode('none')} data-testid="t-none" />
            <md-outlined-segmented-button
              label="1 min"
              selected={timerMode === 'per-question' && secondsPerQuestion === 60}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(60) }}
              data-testid="t-1min"
            />
            <md-outlined-segmented-button
              label="2 min"
              selected={timerMode === 'per-question' && secondsPerQuestion === 120}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(120) }}
              data-testid="t-2min"
            />
          </md-outlined-segmented-button-set>
        </div>

        <div className="simulado-actions simulado-actions--mt-lg">
          <md-outlined-button onClick={onBack} disabled={loading} className="btn-secondary">Voltar</md-outlined-button>
          <md-filled-button onClick={handleStart} disabled={loading} className="btn-primary" data-testid="start-config-btn">
            {loading ? 'Carregando...' : 'Começar Simulado'}
          </md-filled-button>
        </div>
      </div>
    </div>
  )
}
