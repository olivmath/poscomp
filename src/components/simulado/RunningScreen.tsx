import '@material/web/button/filled-button.js'
import { useState, useEffect } from 'react'
import { ImmersiveBar } from './ImmersiveBar'
import { ExitModal } from './ExitModal'
import { QuestionMapModal } from './QuestionMapModal'
import { ReportIssueModal } from './ReportIssueModal'
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
  onNext: (confidence: Confidence, issue?: { comment?: string }) => void
  onSkip: () => void
  onGoToQuestion: (index: number) => void
  onQuit: () => void
}) {
  const [showExitModal, setShowExitModal] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueComment, setIssueComment] = useState<string | undefined>()
  const hasSelection = selectedOption !== null

  useEffect(() => {
    setIssueComment(undefined)
  }, [currentIndex])

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

          <div className="confidence-buttons">
            <button className="confidence-btn confidence-btn--unsure" disabled={!hasSelection} onClick={() => onNext('unsure', issueComment ? { comment: issueComment } : undefined)} data-testid="btn-unsure">
              <span className="material-symbols-outlined confidence-btn-icon">help_outline</span>
              <span className="confidence-btn-label">Não sei</span>
              <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
            </button>
            <button className="confidence-btn confidence-btn--studying" disabled={!hasSelection} onClick={() => onNext('studying', issueComment ? { comment: issueComment } : undefined)} data-testid="btn-studying">
              <span className="material-symbols-outlined confidence-btn-icon">school</span>
              <span className="confidence-btn-label">Estudando</span>
              <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
            </button>
            <button className="confidence-btn confidence-btn--should-know" disabled={!hasSelection} onClick={() => onNext('should_know', issueComment ? { comment: issueComment } : undefined)} data-testid="btn-should-know">
              <span className="material-symbols-outlined confidence-btn-icon">warning</span>
              <span className="confidence-btn-label">Devia saber</span>
              <span className="material-symbols-outlined confidence-btn-arrow">arrow_forward</span>
            </button>
          </div>

          <button
            className={`flag-btn${issueComment ? ' flag-btn--active' : ''}`}
            onClick={() => setShowIssueModal(true)}
            data-testid="flag-btn"
          >
            <span className="material-symbols-outlined">{issueComment ? 'flag' : 'outlined_flag'}</span>
            {issueComment ? 'Problema relatado' : 'Relatar problema'}
          </button>

          <button className="skip-btn" onClick={onSkip} data-testid="skip-btn">
            <span className="material-symbols-outlined skip-btn-icon">skip_next</span>
            Pular questão
          </button>
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
    </div>
  )
}
