import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import type { Area, Option, Confidence, Question } from '../types'

// ── Input types (mirror functions/src/types.ts) ───────────────────────────────

export interface GetSimuladoQuestionsInput {
  areas: Area[]
  total: number
}

export interface AnswerInput {
  questionId: number
  selected: Option
  confidence: NonNullable<Confidence>
}

export interface FinishSimuladoInput {
  answers: AnswerInput[]
  timeSpentSeconds: number
}

export interface ReviewCardInput {
  questionId: number
  studied: boolean
}

// ── Output types (mirror functions/src/types.ts) ──────────────────────────────

export interface AnswerOutput {
  questionId: number
  selected: Option
  correct: boolean
  confidence: NonNullable<Confidence>
  question: {
    enunciado: string
    alternativas: Record<Option, string>
    resposta: Option
    comentario?: string
  }
}

export interface AreaBreakdown {
  correct: number
  total: number
}

export interface FinishSimuladoOutput {
  resultId: string
  score: number
  totalQuestions: number
  timeSpentSeconds: number
  areaBreakdown: Record<Area, AreaBreakdown>
  answers: AnswerOutput[]
}

export interface PendingCardOutput {
  questionId: number
  priority: 'P1' | 'P2' | 'P3'
  lastConfidence: NonNullable<Confidence>
  dueDate: string
  repetitions: number
  easeFactor: number
  interval: number
  question: Question
}

export interface ReviewCardOutput {
  nextDueDays: number
  nextDueDate: string
  newInterval: number
  newEaseFactor: number
  newRepetitions: number
}

// ── httpsCallable wrappers ────────────────────────────────────────────────────

export const callGetSimuladoQuestions = httpsCallable<
  GetSimuladoQuestionsInput,
  { questions: Question[] }
>(functions, 'getSimuladoQuestions')

export const callFinishSimulado = httpsCallable<
  FinishSimuladoInput,
  FinishSimuladoOutput
>(functions, 'finishSimulado')

export const callGetPendingCards = httpsCallable<
  Record<string, never>,
  { cards: PendingCardOutput[] }
>(functions, 'getPendingCards')

export const callReviewCard = httpsCallable<
  ReviewCardInput,
  ReviewCardOutput
>(functions, 'reviewCard')

export const callDeleteAllData = httpsCallable<
  Record<string, never>,
  { deleted: boolean }
>(functions, 'deleteAllData')

export const callReportQuestion = httpsCallable<
  { questionId: number; comment?: string },
  { success: boolean }
>(functions, 'reportQuestion')

export interface SubmitPremiumRequestInput {
  receiptUrl: string
}
export interface SubmitPremiumRequestOutput {
  requestId: string
}
export const callSubmitPremiumRequest = httpsCallable<
  SubmitPremiumRequestInput,
  SubmitPremiumRequestOutput
>(functions, 'submitPremiumRequest')

export interface ReviewPremiumRequestInput {
  requestId: string
  action: 'approve' | 'deny'
}
export interface ReviewPremiumRequestOutput {
  success: boolean
}
export const callReviewPremiumRequest = httpsCallable<
  ReviewPremiumRequestInput,
  ReviewPremiumRequestOutput
>(functions, 'reviewPremiumRequest')

export interface ResolveFlaggedQuestionInput {
  id: string
}
export interface ResolveFlaggedQuestionOutput {
  success: boolean
}
export const callResolveFlaggedQuestion = httpsCallable<
  ResolveFlaggedQuestionInput,
  ResolveFlaggedQuestionOutput
>(functions, 'resolveFlaggedQuestion')
