import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/progress/circular-progress.js'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulado } from '../hooks/useSimulado'
import { useImmersiveMode } from '../contexts/ImmersiveModeContext'
import { AREA_ICONS } from '../utils/areaIcons'
import type { Option, Area, SimuladoConfig, QuestionStatus, Confidence, Question } from '../types'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']
const AREAS: Area[] = ['Matemática', 'Fundamentos da Computação', 'Tecnologia da Computação']

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}min ${s}s`
}

// ── Exit Confirmation Modal ──────────────────────────────────────────────────
function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="immersive-modal-overlay" onClick={onCancel}>
      <div className="immersive-exit-modal" onClick={(e) => e.stopPropagation()}>
        <span className="material-symbols-outlined md-icon--lg md-icon--warning">
          warning
        </span>
        <h3 className="exit-modal-title">Sair do simulado?</h3>
        <p className="exit-modal-body">Seu progresso será perdido. Esta ação não pode ser desfeita.</p>
        <div className="exit-modal-actions">
          <button className="exit-modal-btn exit-modal-btn--cancel" onClick={onCancel}>
            Continuar
          </button>
          <button className="exit-modal-btn exit-modal-btn--confirm" onClick={onConfirm}>
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question Map Modal ───────────────────────────────────────────────────────
function QuestionMapModal({
  statuses,
  currentIndex,
  onGo,
  onClose,
}: {
  statuses: QuestionStatus[]
  currentIndex: number
  onGo: (index: number) => void
  onClose: () => void
}) {
  const legend = [
    { status: 'unvisited',   label: 'Não visitada', icon: 'radio_button_unchecked' },
    { status: 'skipped',     label: 'Pulada',        icon: 'skip_next' },
    { status: 'unsure',      label: 'Não sei',       icon: 'help_outline' },
    { status: 'studying',    label: 'Estudando',     icon: 'school' },
    { status: 'should_know', label: 'Devia saber',   icon: 'warning' },
  ] as const

  return (
    <div className="immersive-modal-overlay" onClick={onClose}>
      <div className="question-map-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="question-map-header">
          <span className="question-map-title">Mapa de questões</span>
          <button className="question-map-close" onClick={onClose} aria-label="Fechar mapa">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="question-map-grid" data-testid="question-map-grid">
          {statuses.map((status, i) => (
            <button
              key={i}
              className={`question-map-btn question-map-btn--${status} ${i === currentIndex ? 'question-map-btn--current' : ''}`}
              onClick={() => { onGo(i); onClose() }}
              aria-label={`Questão ${i + 1} — ${status}`}
              data-testid={`map-q-${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="question-map-legend">
          {legend.map(({ status, label, icon }) => (
            <span key={status} className="map-legend-item">
              <span className={`material-symbols-outlined map-legend-icon map-legend-icon--${status}`}>{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Immersive Bar ────────────────────────────────────────────────────────────
function ImmersiveBar({
  questionNumber,
  totalQuestions,
  secondsLeft,
  timerMode,
  onExit,
  onMap,
}: {
  questionNumber: number
  totalQuestions: number
  secondsLeft: number
  timerMode: 'none' | 'per-question'
  onExit: () => void
  onMap: () => void
}) {
  const isRed = secondsLeft < 60 && timerMode === 'per-question'

  return (
    <div className="immersive-bar" data-testid="immersive-bar">
      <button className="immersive-bar-exit" onClick={onExit} aria-label="Sair do simulado" data-testid="exit-btn">
        <span className="material-symbols-outlined immersive-bar-exit-icon">close</span>
        <span className="immersive-bar-exit-label">Sair</span>
      </button>

      <span className="immersive-bar-progress" data-testid="question-progress">
        Q. {questionNumber}/{totalQuestions}
      </span>

      {timerMode === 'per-question' && (
        <span
          className={`immersive-bar-timer ${isRed ? 'immersive-bar-timer--red' : ''}`}
          data-testid="timer"
        >
          <span className="material-symbols-outlined immersive-bar-timer-icon">
            timer
          </span>
          {formatTime(secondsLeft)}
        </span>
      )}

      <button className="immersive-bar-map" onClick={onMap} aria-label="Mapa de questões" data-testid="map-btn">
        <span className="material-symbols-outlined">grid_view</span>
        <span className="immersive-bar-map-label">Mapa</span>
      </button>
    </div>
  )
}

// ── Idle Screen ──────────────────────────────────────────────────────────────
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

// ── Config Screen ────────────────────────────────────────────────────────────
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
          <div className="area-chips" style={{ marginTop: '8px' }}>
            <button
              className={`area-chip${areas.length === 0 ? ' area-chip--active' : ''}`}
              onClick={() => setAreas([])}
              data-testid="chip-all"
            >
              <span className="material-symbols-outlined area-chip-icon">select_all</span>
              Todas
            </button>
            {AREAS.map(area => (
              <button
                key={area}
                className={`area-chip${areas.includes(area) ? ' area-chip--active' : ''}`}
                onClick={() => toggleArea(area)}
                data-testid={`chip-${area}`}
              >
                <span className="material-symbols-outlined area-chip-icon">{AREA_ICONS[area]}</span>
                {area}
              </button>
            ))}
          </div>
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
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(60) }}
              data-testid="t-1min"
            >
              1 min
            </button>
            <button
              className={`segmented-btn ${timerMode === 'per-question' && secondsPerQuestion === 120 ? 'active' : ''}`}
              onClick={() => { setTimerMode('per-question'); setSecondsPerQuestion(120) }}
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
            disabled={loading}
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
  questionStatuses,
  currentIndex,
  onSelect,
  onNext,
  onSkip,
  onGoToQuestion,
  onQuit,
}: {
  question: Question
  questionNumber: number
  totalQuestions: number
  selectedOption: Option | null
  secondsLeft: number
  timerMode: 'none' | 'per-question'
  questionStatuses: QuestionStatus[]
  currentIndex: number
  onSelect: (opt: Option) => void
  onNext: (confidence: Confidence) => void
  onSkip: () => void
  onGoToQuestion: (index: number) => void
  onQuit: () => void
}) {
  const [showExitModal, setShowExitModal] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const hasSelection = selectedOption !== null

  return (
    <div className="simulado-running-immersive" data-testid="simulado-running">
      {/* Immersive top bar */}
      <ImmersiveBar
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        secondsLeft={secondsLeft}
        timerMode={timerMode}
        onExit={() => setShowExitModal(true)}
        onMap={() => setShowMap(true)}
      />

      {/* Progress bar */}
      <div className="immersive-progress-bar">
        <div
          className="immersive-progress-fill"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="immersive-question-wrap">
        <div className="simulado-question-card">
          <p className="simulado-question-text" data-testid="question-text">
            {question.enunciado}
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
                <span className="simulado-option-text">{question.alternativas[opt]}</span>
              </button>
            ))}
          </div>

          {/* Confidence buttons */}
          <div className="confidence-buttons">
            <button
              className="confidence-btn confidence-btn--unsure"
              disabled={!hasSelection}
              onClick={() => onNext('unsure')}
              data-testid="btn-unsure"
            >
              <span className="material-symbols-outlined confidence-btn-icon">help_outline</span>
              <span className="confidence-btn-label">Não sei</span>
              <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
            </button>

            <button
              className="confidence-btn confidence-btn--studying"
              disabled={!hasSelection}
              onClick={() => onNext('studying')}
              data-testid="btn-studying"
            >
              <span className="material-symbols-outlined confidence-btn-icon">school</span>
              <span className="confidence-btn-label">Estudando</span>
              <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
            </button>

            <button
              className="confidence-btn confidence-btn--should-know"
              disabled={!hasSelection}
              onClick={() => onNext('should_know')}
              data-testid="btn-should-know"
            >
              <span className="material-symbols-outlined confidence-btn-icon">warning</span>
              <span className="confidence-btn-label">Devia saber</span>
              <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
            </button>
          </div>

          {/* Skip button */}
          <button
            className="skip-btn"
            onClick={onSkip}
            data-testid="skip-btn"
          >
            <span className="material-symbols-outlined skip-btn-icon">skip_next</span>
            Pular questão
          </button>
        </div>
      </div>

      {/* Modals */}
      {showExitModal && (
        <ExitModal
          onConfirm={onQuit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {showMap && (
        <QuestionMapModal
          statuses={questionStatuses}
          currentIndex={currentIndex}
          onGo={onGoToQuestion}
          onClose={() => setShowMap(false)}
        />
      )}
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
  const { setImmersive } = useImmersiveMode()
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
    questionStatuses,
    goToConfig,
    start,
    select,
    next,
    skip,
    goToQuestion,
    retry,
  } = useSimulado()

  // Sync immersive mode with simulado state
  useEffect(() => {
    setImmersive(state === 'running')
    return () => setImmersive(false)
  }, [state, setImmersive])

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
        questionStatuses={questionStatuses}
        currentIndex={currentIndex}
        onSelect={select}
        onNext={next}
        onSkip={skip}
        onGoToQuestion={goToQuestion}
        onQuit={retry}
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
