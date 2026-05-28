import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/progress/circular-progress.js'
import { useNavigate } from 'react-router-dom'
import { useSimulado } from '../hooks/useSimulado'
import type { Option } from '../types'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

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
  loading,
  error,
  lastScore,
  lastTime,
}: {
  onStart: () => void
  loading: boolean
  error: string | null
  lastScore: number | null
  lastTime: number | null
}) {
  return (
    <div className="simulado-container" data-testid="simulado-idle">
      <div className="simulado-card">
        <span className="material-symbols-outlined md-icon--lg md-icon--primary">quiz</span>
        <h1 className="simulado-idle-title">Simulado POSCOMP</h1>
        <div className="simulado-info-chips">
          <span className="simulado-chip">10 questoes</span>
          <span className="simulado-chip">20 minutos</span>
          <span className="simulado-chip">Multipla escolha A-E</span>
        </div>

        {lastScore !== null && lastTime !== null && (
          <p className="simulado-last-result" data-testid="last-result">
            Ultimo: <strong>{lastScore}/10</strong> &middot; {formatDuration(lastTime)}
          </p>
        )}

        {error && <p className="simulado-error" role="alert">{error}</p>}

        <div className="home-actions">
          <md-filled-button
            onClick={onStart}
            disabled={loading}
            data-testid="start-btn"
          >
            {loading ? 'Carregando...' : 'Comecar'}
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
  onSelect,
  onNext,
}: {
  question: { text: string; options: Record<Option, string> }
  questionNumber: number
  totalQuestions: number
  selectedOption: Option | null
  secondsLeft: number
  onSelect: (opt: Option) => void
  onNext: () => void
}) {
  const isLast = questionNumber === totalQuestions
  const isRed = secondsLeft < 120

  return (
    <div className="simulado-running" data-testid="simulado-running">
      <div className="simulado-header">
        <span className="simulado-progress" data-testid="question-progress">
          {questionNumber} / {totalQuestions}
        </span>
        <span
          className={`simulado-timer ${isRed ? 'simulado-timer--red' : ''}`}
          data-testid="timer"
        >
          {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="simulado-progress-bar">
        <div
          className="simulado-progress-fill"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

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

        <div className="home-actions" style={{ marginTop: '16px' }}>
          <md-filled-button
            onClick={onNext}
            disabled={selectedOption === null}
            style={{ width: '100%' } as React.CSSProperties}
            data-testid="next-btn"
          >
            {isLast ? 'Finalizar' : 'Proxima'}
          </md-filled-button>
        </div>
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
        <p className="simulado-time-spent">{formatDuration(timeSpent)}</p>

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
                      <span className={`material-symbols-outlined md-icon--sm md-icon--filled ${ok ? 'md-icon--green' : 'md-icon--warning'}`}>
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
          <md-outlined-button onClick={onRetry} data-testid="retry-btn">
            Refazer
          </md-outlined-button>
          <md-filled-button onClick={onHistory} data-testid="history-btn">
            Ver Historico
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
    start,
    select,
    next,
    retry,
  } = useSimulado()

  if (state === 'idle') {
    return (
      <IdleScreen
        onStart={start}
        loading={loading}
        error={error}
        lastScore={lastResult?.score ?? null}
        lastTime={lastResult?.timeSpentSeconds ?? null}
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
