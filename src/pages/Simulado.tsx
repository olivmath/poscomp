import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/chips/filter-chip.js'
import '@material/web/chips/chip-set.js'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulado } from '../hooks/useSimulado'
import type { Option, Area, SimuladoConfig } from '../types'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']
const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}min ${s}s`
}

// ── Idle Screen ─────────────────────────────────────────────────────────────
function IdleScreen({
  onStart,
  onConfig,
  loading,
  error,
  lastScore,
  lastTime,
}: {
  onStart: () => void
  onConfig: () => void
  loading: boolean
  error: string | null
  lastScore: number | null
  lastTime: number | null
}) {
  return (
    <div className="simulado-container" data-testid="simulado-idle">
      <div className="simulado-card">
        <h1 className="simulado-idle-title">Simulado POSCOMP</h1>
        <div className="simulado-info-chips">
          <span className="simulado-chip">Focado ou Geral</span>
          <span className="simulado-chip">Personalizável</span>
          <span className="simulado-chip">Múltipla escolha A–E</span>
        </div>

        {lastScore !== null && lastTime !== null && (
          <p className="simulado-last-result" data-testid="last-result">
            Último: <strong>{lastScore}</strong> acertos · {formatDuration(lastTime)}
          </p>
        )}

        {error && <p className="simulado-error" role="alert">{error}</p>}

        <div className="simulado-actions" style={{ marginTop: '16px' }}>
          <md-outlined-button
            onClick={onConfig}
            disabled={loading}
            className="btn-secondary"
            data-testid="config-btn"
          >
            Configurar
          </md-outlined-button>
          <md-filled-button
            onClick={onStart}
            disabled={loading}
            className="btn-primary"
            data-testid="start-btn"
          >
            {loading ? 'Carregando...' : 'Começar'}
          </md-filled-button>
        </div>
      </div>
    </div>
  )
}

// ── Config Screen ───────────────────────────────────────────────────────────
function ConfigScreen({
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

  const toggleArea = (area: Area) => {
    setAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const handleStart = () => {
    onStart({
      areas,
      totalQuestions,
      timerMode,
      secondsPerQuestion: timerMode === 'per-question' ? secondsPerQuestion : undefined
    })
  }

  return (
    <div className="simulado-container" data-testid="simulado-config">
      <div className="simulado-card">
        <h2 className="simulado-idle-title">Configurar Simulado</h2>

        <div className="config-section" style={{ width: '100%' }}>
          <p className="config-label">Temas</p>
          <md-chip-set style={{ marginTop: '8px', justifyContent: 'center' }}>
            <md-filter-chip
              label="Todas"
              selected={areas.length === 0}
              onClick={() => setAreas([])}
              data-testid="chip-all"
            />
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

        <div className="config-section" style={{ width: '100%', marginTop: '8px' }}>
          <p className="config-label">Nº de questões</p>
          <div className="segmented-buttons" style={{ marginTop: '8px' }}>
            {[5, 10, 20, 0].map(val => (
              <button
                key={val}
                className={`segmented-btn ${totalQuestions === val ? 'active' : ''}`}
                onClick={() => setTotalQuestions(val)}
                data-testid={`q-${val === 0 ? 'max' : val}`}
              >
                {val === 0 ? 'Máximo' : val}
              </button>
            ))}
          </div>
        </div>

        <div className="config-section" style={{ width: '100%', marginTop: '8px' }}>
          <p className="config-label">Tempo por questão</p>
          <div className="segmented-buttons" style={{ marginTop: '8px' }}>
            <button
              className={`segmented-btn ${timerMode === 'none' ? 'active' : ''}`}
              onClick={() => setTimerMode('none')}
              data-testid="t-none"
            >
              Sem limite
            </button>
            <button
              className={`segmented-btn ${timerMode === 'per-question' && secondsPerQuestion === 60 ? 'active' : ''}`}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(60); }}
              data-testid="t-1min"
            >
              1 min
            </button>
            <button
              className={`segmented-btn ${timerMode === 'per-question' && secondsPerQuestion === 120 ? 'active' : ''}`}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(120); }}
              data-testid="t-2min"
            >
              2 min
            </button>
          </div>
        </div>

        <div className="simulado-actions" style={{ marginTop: '24px' }}>
          <md-outlined-button onClick={onBack} disabled={loading} className="btn-secondary">
            Voltar
          </md-outlined-button>
          <md-filled-button
            onClick={handleStart}
            disabled={loading || (areas.length === 0 && AREAS.every(a => !areas.includes(a)) && false)} // Simplificando: sempre habilitado pois [] = todas
            className="btn-primary"
            data-testid="start-config-btn"
          >
            {loading ? 'Carregando...' : 'Começar Simulado'}
          </md-filled-button>
        </div>
      </div>
    </div>
  )
}

// ── Running Screen ───────────────────────────────────────────────────────────
function RunningScreen({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  secondsLeft,
  timerMode,
  onSelect,
  onNext,
}: {
  question: { text: string; options: Record<Option, string> }
  questionNumber: number
  totalQuestions: number
  selectedOption: Option | null
  secondsLeft: number
  timerMode: 'none' | 'per-question'
  onSelect: (opt: Option) => void
  onNext: () => void
}) {
  const isLast = questionNumber === totalQuestions
  const isRed = secondsLeft < 60 && timerMode === 'per-question'

  return (
    <div className="simulado-running" data-testid="simulado-running">
      {/* Header */}
      <div className="simulado-header">
        <span className="simulado-progress" data-testid="question-progress">
          {questionNumber} / {totalQuestions}
        </span>
        {timerMode === 'per-question' && (
          <span
            className={`simulado-timer ${isRed ? 'simulado-timer--red' : ''}`}
            data-testid="timer"
          >
            {formatTime(secondsLeft)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="simulado-progress-bar">
        <div
          className="simulado-progress-fill"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="simulado-question-card">
        <p className="simulado-question-text" data-testid="question-text">
          {question.text}
        </p>

        <div className="simulado-options">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`simulado-option ${selectedOption === opt ? 'simulado-option--selected' : ''}`}
              onClick={() => onSelect(opt)}
              data-testid={`option-${opt}`}
            >
              <span className="simulado-option-letter">{opt}</span>
              <span className="simulado-option-text">{question.options[opt]}</span>
            </button>
          ))}
        </div>

        <md-filled-button
          onClick={onNext}
          disabled={selectedOption === null}
          className="btn-full"
          style={{ marginTop: '16px' }}
          data-testid="next-btn"
        >
          {isLast ? 'Finalizar' : 'Próxima'}
        </md-filled-button>
      </div>
    </div>
  )
}

// ── Finished Screen ──────────────────────────────────────────────────────────
function FinishedScreen({
  score,
  totalQuestions,
  timeSpent,
  areaBreakdown,
  onRetry,
  onHistory,
}: {
  score: number
  totalQuestions: number
  timeSpent: number
  areaBreakdown: Record<string, { correct: number; total: number }>
  onRetry: () => void
  onHistory: () => void
}) {
  return (
    <div className="simulado-container" data-testid="simulado-finished">
      <div className="simulado-card">
        <div className="simulado-score" data-testid="final-score">
          {score} <span className="simulado-score-total">/ {totalQuestions}</span>
        </div>
        {timeSpent > 0 && <p className="simulado-time-spent">{formatDuration(timeSpent)}</p>}

        {/* Breakdown */}
        <div className="simulado-breakdown">
          <table className="simulado-breakdown-table" data-testid="breakdown-table">
            <tbody>
              {Object.entries(areaBreakdown).map(([area, data]) => {
                const ok = data.correct === data.total
                return (
                  <tr key={area}>
                    <td className="bd-area">{area}</td>
                    <td className="bd-score">{data.correct}/{data.total}</td>
                    <td className="bd-icon">
                      <span 
                        className={`material-symbols-outlined md-icon--sm md-icon--filled ${ok ? 'md-icon--green' : 'md-icon--warning'}`}
                        role="img"
                        aria-label={ok ? 'Aprovado' : 'Requer atenção'}
                      >
                        {ok ? 'check_circle' : 'warning'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="simulado-actions">
          <md-outlined-button onClick={onRetry} className="btn-secondary" data-testid="retry-btn">
            Refazer
          </md-outlined-button>
          <md-filled-button onClick={onHistory} className="btn-primary" data-testid="history-btn">
            Ver Histórico
          </md-filled-button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export function Simulado() {
  const navigate = useNavigate()
  const {
    state,
    questions,
    currentIndex,
    selectedOption,
    secondsLeft,
    loading,
    error,
    result,
    lastResult,
    config,
    goToConfig,
    start,
    select,
    next,
    retry,
  } = useSimulado()

  if (state === 'idle') {
    return (
      <IdleScreen
        onStart={() => start(config)}
        onConfig={goToConfig}
        loading={loading}
        error={error}
        lastScore={lastResult?.score ?? null}
        lastTime={lastResult?.timeSpentSeconds ?? null}
      />
    )
  }

  if (state === 'config') {
    return (
      <ConfigScreen
        initialConfig={config}
        onStart={start}
        onBack={retry}
        loading={loading}
      />
    )
  }

  if (state === 'running' && questions.length > 0) {
    return (
      <RunningScreen
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        selectedOption={selectedOption}
        secondsLeft={secondsLeft}
        timerMode={config.timerMode}
        onSelect={select}
        onNext={next}
      />
    )
  }

  if (state === 'finished' && result) {
    return (
      <FinishedScreen
        score={result.score}
        totalQuestions={result.totalQuestions}
        timeSpent={result.timeSpentSeconds}
        areaBreakdown={result.areaBreakdown}
        onRetry={retry}
        onHistory={() => navigate('/historico')}
      />
    )
  }

  return null
}
