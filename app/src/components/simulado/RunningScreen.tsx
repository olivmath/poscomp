import '@material/web/button/filled-button.js'
import { useState, useEffect } from 'react'
import { AREA_ICONS, AREA_SHORT } from '../../utils/areaIcons'
import { ImmersiveBar } from './ImmersiveBar'
import { ExitModal } from './ExitModal'
import { FinishModal } from './FinishModal'
import { QuestionMapModal } from './QuestionMapModal'
import { ReportIssueModal } from './ReportIssueModal'
import { LoadingModal } from '../LoadingModal'
import type { Option, QuestionStatus, Confidence, Question } from '../../types'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

export function RunningScreen({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  secondsLeft,
  timerMode,
  questionStatuses,
  currentIndex,
  loadingFinish,
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
  loadingFinish: boolean
  onSelect: (opt: Option) => void
  onNext: (confidence: Confidence, issue?: { comment?: string }) => void
  onSkip: () => void
  onGoToQuestion: (index: number) => void
  onQuit: () => void
}) {
  const [showExitModal, setShowExitModal] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [issueComment, setIssueComment] = useState<string | undefined>()
  const [pendingFinish, setPendingFinish] = useState<{ confidence: Confidence; issue?: { comment?: string } } | null>(null)
  const hasSelection = selectedOption !== null
  const currentAnswered = questionStatuses[currentIndex] !== 'unvisited'
  const isFirstQuestion = currentIndex === 0
  const isLastQuestion = questionNumber === totalQuestions

  useEffect(() => {
    setIssueComment(undefined)
  }, [currentIndex])

  const handleNext = (confidence: Confidence, issue?: { comment?: string }) => {
    if (isLastQuestion) {
      setPendingFinish({ confidence, issue })
      setShowFinishModal(true)
    } else {
      onNext(confidence, issue)
    }
  }

  return (
    <div className="simulado-running-immersive" data-testid="simulado-running">
      <ImmersiveBar
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        secondsLeft={secondsLeft}
        timerMode={timerMode}
        onExit={() => setShowExitModal(true)}
        onMap={() => setShowMap(true)}
      />

      <div className="immersive-progress-bar">
        <div className="immersive-progress-fill" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
      </div>

      <div className="immersive-question-wrap">
        <div className="simulado-question-card">
          <div className="simulado-area-badge">
            <span className="material-symbols-outlined simulado-area-badge-icon">{AREA_ICONS[question.area]}</span>
            {AREA_SHORT[question.area]}
          </div>
          <p className="simulado-question-text" data-testid="question-text">{question.enunciado}</p>

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

          <div className="simulado-action-footer">
            <div className="confidence-buttons">
              <button className="confidence-btn confidence-btn--unsure" disabled={!hasSelection || currentAnswered} onClick={() => handleNext('unsure', issueComment ? { comment: issueComment } : undefined)} data-testid="btn-unsure" title={currentAnswered ? 'Questão já respondida' : ''}>
                <span className="material-symbols-outlined confidence-btn-icon">help_outline</span>
                <span className="confidence-btn-label">Não sei</span>
                <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
              </button>
              <button className="confidence-btn confidence-btn--studying" disabled={!hasSelection || currentAnswered} onClick={() => handleNext('studying', issueComment ? { comment: issueComment } : undefined)} data-testid="btn-studying" title={currentAnswered ? 'Questão já respondida' : ''}>
                <span className="material-symbols-outlined confidence-btn-icon">school</span>
                <span className="confidence-btn-label">Estudando</span>
                <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
              </button>
              <button className="confidence-btn confidence-btn--should-know" disabled={!hasSelection || currentAnswered} onClick={() => handleNext('should_know', issueComment ? { comment: issueComment } : undefined)} data-testid="btn-should-know" title={currentAnswered ? 'Questão já respondida' : ''}>
                <span className="material-symbols-outlined confidence-btn-icon">warning</span>
                <span className="confidence-btn-label">Devia saber</span>
                <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
              </button>
            </div>

            <div className="simulado-nav-actions">
              <button
                className="nav-action-btn"
                onClick={() => onGoToQuestion(currentIndex - 1)}
                disabled={isFirstQuestion}
                aria-label="Questão anterior"
                data-testid="previous-btn"
              >
                <span className="material-symbols-outlined">chevron_left</span>
                Anterior
              </button>
              <button
                className={`nav-action-btn${issueComment ? ' nav-action-btn--active' : ''}`}
                onClick={() => setShowIssueModal(true)}
                aria-label="Relatar problema"
                data-testid="flag-btn"
              >
                <span className="material-symbols-outlined">{issueComment ? 'flag' : 'outlined_flag'}</span>
                {issueComment ? 'Relatado' : 'Reportar'}
              </button>
              <button
                className="nav-action-btn"
                onClick={onSkip}
                aria-label="Pular questão"
                data-testid="skip-btn"
              >
                <span className="material-symbols-outlined">skip_next</span>
                Pular
              </button>
            </div>
          </div>
        </div>
      </div>

      {showExitModal && <ExitModal onConfirm={onQuit} onCancel={() => setShowExitModal(false)} />}
      {showMap && <QuestionMapModal statuses={questionStatuses} currentIndex={currentIndex} onGo={onGoToQuestion} onClose={() => setShowMap(false)} />}
      {showIssueModal && (
        <ReportIssueModal
          initialComment={issueComment}
          onConfirm={(comment) => {
            setIssueComment(comment)
            setShowIssueModal(false)
          }}
          onCancel={() => setShowIssueModal(false)}
        />
      )}
      {showFinishModal && pendingFinish && (
        <FinishModal
          onConfirm={() => {
            setShowFinishModal(false)
            onNext(pendingFinish.confidence, pendingFinish.issue)
            setPendingFinish(null)
          }}
          onCancel={() => {
            setShowFinishModal(false)
            setPendingFinish(null)
          }}
        />
      )}
      <LoadingModal open={loadingFinish} label="Calculando resultado…" />
    </div>
  )
}
