import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import { useState } from 'react'
import type { Area, SimuladoConfig } from '../../types'
import { AREA_ICONS } from '../../utils/areaIcons'

const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']

const AREA_SHORT: Record<Area, string> = {
  'Matemática': 'Matemática',
  'Fundamentos da Computação': 'Fund. Computação',
  'Tecnologia da Computação': 'Tec. Computação',
}

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

        {/* Step 1 — Temas / Áreas */}
        <div className="config-step">
          <div className="config-step-header">
            <span className="config-step-badge">1</span>
            <p className="config-label">Temas</p>
          </div>
          <div className="area-chips">
            <button
              className={`area-chip${areas.length === 0 ? ' area-chip--active' : ''}`}
              onClick={() => setAreas([])}
              data-testid="chip-all"
              aria-pressed={areas.length === 0}
            >
              <span className="material-symbols-outlined area-chip-icon">apps</span>
              Todas
            </button>
            {AREAS.map(area => (
              <button
                key={area}
                className={`area-chip${areas.includes(area) ? ' area-chip--active' : ''}`}
                onClick={() => toggleArea(area)}
                data-testid={`chip-${area}`}
                aria-pressed={areas.includes(area)}
              >
                <span className="material-symbols-outlined area-chip-icon">{AREA_ICONS[area]}</span>
                {AREA_SHORT[area]}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Nº de questões */}
        <div className="config-step">
          <div className="config-step-header">
            <span className="config-step-badge">2</span>
            <p className="config-label">Nº de questões</p>
          </div>
          <div className="segmented-buttons segmented-buttons--mt">
            {[5, 10, 20, 0].map(val => (
              <button
                key={val}
                className={`segmented-btn${totalQuestions === val ? ' active' : ''}`}
                onClick={() => setTotalQuestions(val)}
                data-testid={`q-${val === 0 ? 'max' : val}`}
              >
                {val === 0 ? 'Máximo' : String(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — Tempo */}
        <div className="config-step">
          <div className="config-step-header">
            <span className="config-step-badge">3</span>
            <p className="config-label">Tempo por questão</p>
          </div>
          <div className="segmented-buttons segmented-buttons--mt">
            <button
              className={`segmented-btn${timerMode === 'none' ? ' active' : ''}`}
              onClick={() => setTimerMode('none')}
              data-testid="t-none"
            >
              Sem limite
            </button>
            <button
              className={`segmented-btn${timerMode === 'per-question' && secondsPerQuestion === 60 ? ' active' : ''}`}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(60) }}
              data-testid="t-1min"
            >
              1 min
            </button>
            <button
              className={`segmented-btn${timerMode === 'per-question' && secondsPerQuestion === 120 ? ' active' : ''}`}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(120) }}
              data-testid="t-2min"
            >
              2 min
            </button>
          </div>
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
