import { useMemo, useState } from 'react'
import { AREA_ICONS } from '../utils/areaIcons'
import type { AnswerRecord, Confidence, Option, QuestionReview } from '../types'

const OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']

const CONFIDENCE_LABELS: Record<Exclude<Confidence, null>, string> = {
  unsure: 'Não sei',
  studying: 'Estudando',
  should_know: 'Devia saber',
}

function getAnswerLabel(answer?: AnswerRecord): string {
  if (!answer || answer.skipped) return 'Pulada'
  return answer.selected ?? 'Sem resposta'
}

function getConfidenceLabel(confidence: Confidence): string {
  if (!confidence) return 'Sem classificação'
  return CONFIDENCE_LABELS[confidence]
}

interface QuestionReviewListProps {
  answers: AnswerRecord[]
  questions?: QuestionReview[]
}

export function QuestionReviewList({ answers, questions }: QuestionReviewListProps) {
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(null)

  const answerByQuestion = useMemo(
    () => new Map(answers.map((answer) => [answer.questionId, answer])),
    [answers]
  )

  if (!questions?.length) return null

  return (
    <section className="question-review" aria-label="Questões do simulado">
      <div className="question-review-header">
        <span className="question-review-title">Questões</span>
        <span className="question-review-hint">Toque para ver o comentário</span>
      </div>

      <div className="question-review-list">
        {questions.map((question, index) => {
          const answer = answerByQuestion.get(question.id)
          const isOpen = openQuestionId === question.id
          const isCorrect = answer?.correct === true
          const resultClass = isCorrect ? 'question-review-item--correct' : 'question-review-item--wrong'

          return (
            <article key={question.id} className={`question-review-item ${resultClass}`}>
              <button
                type="button"
                className="question-review-trigger"
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenQuestionId((current) => current === question.id ? null : question.id)
                }}
                aria-expanded={isOpen}
                data-testid={`review-question-${index + 1}`}
              >
                <span className="question-review-number">{index + 1}</span>
                <span className="question-review-summary">
                  <span className="question-review-area">
                    <span className="material-symbols-outlined question-review-area-icon">
                      {AREA_ICONS[question.area]}
                    </span>
                    {question.area}
                  </span>
                  <span className="question-review-answer">
                    Sua resposta: {getAnswerLabel(answer)} · Gabarito: {question.resposta}
                  </span>
                </span>
                <span
                  className={`material-symbols-outlined question-review-status ${isCorrect ? 'md-icon--green' : 'md-icon--warning'}`}
                  aria-hidden="true"
                >
                  {isCorrect ? 'check_circle' : 'warning'}
                </span>
                <span className="material-symbols-outlined question-review-chevron">
                  {isOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {isOpen && (
                <div className="question-review-detail" data-testid={`review-detail-${index + 1}`}>
                  <p className="question-review-enunciado">{question.enunciado}</p>

                  <div className="question-review-options">
                    {OPTIONS.map((option) => (
                      <span
                        key={option}
                        className={`question-review-option ${option === question.resposta ? 'question-review-option--correct' : ''} ${option === answer?.selected ? 'question-review-option--selected' : ''}`}
                      >
                        <strong>{option}</strong> {question.alternativas[option]}
                      </span>
                    ))}
                  </div>

                  <div className="question-review-comment">
                    <span className="material-symbols-outlined question-review-comment-icon">
                      chat_bubble
                    </span>
                    <p>{question.comentario || 'Sem comentário cadastrado para esta questão.'}</p>
                  </div>

                  <span className="question-review-confidence">
                    Classificação: {getConfidenceLabel(answer?.confidence ?? null)}
                  </span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
