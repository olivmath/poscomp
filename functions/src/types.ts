import type { Timestamp } from 'firebase-admin/firestore'

// ─── DOMAIN CONSTANTS ────────────────────────────────────────────

export const VALID_AREAS = [
  'Matemática',
  'Fundamentos da Computação',
  'Tecnologia da Computação',
] as const

export const VALID_OPTIONS = [
  'A',
  'B',
  'C',
  'D',
  'E',
] as const

export const VALID_CONFIDENCES = [
  'unsure',
  'studying',
  'should_know',
] as const

// ─── DOMAIN TYPES ────────────────────────────────────────────────

export type Area       = typeof VALID_AREAS[number]
export type Option     = typeof VALID_OPTIONS[number]
export type Confidence = typeof VALID_CONFIDENCES[number]

export type Priority = 'P1' | 'P2' | 'P3'

// ─── BASE ENTITIES ───────────────────────────────────────────────

export interface Question {
  id: number
  ano: number
  area: Area

  enunciado: string

  alternativas: Record<Option, string>

  resposta: Option

  comentario?: string
}

export interface SrsCard {
  questionId: number

  easeFactor: number
  interval: number
  repetitions: number

  dueDate: Timestamp
  createdAt: Timestamp

  lastConfidence: Confidence | null

  studied: boolean
  simuladoCorrect: boolean
}

// ─── SHARED VIEW MODELS ──────────────────────────────────────────

export interface QuestionPreview {
  enunciado: string
  alternativas: Record<Option, string>
  resposta: Option
  comentario?: string
}

export interface FullQuestionView extends QuestionPreview {
  id: number
  ano: number
  area: Area
}

// ─── INPUT TYPES ─────────────────────────────────────────────────

export interface GetSimuladoQuestionsInput {
  areas: Area[]
  total: number
}

export interface AnswerInput {
  questionId: number
  selected: Option
  confidence: Confidence
}

export interface FinishSimuladoInput {
  answers: AnswerInput[]
  timeSpentSeconds: number
}

export interface ReviewCardInput {
  questionId: number
  studied: boolean
}

// ─── OUTPUT TYPES ────────────────────────────────────────────────

export interface AreaBreakdown {
  correct: number
  total: number
}

export interface AnswerOutput {
  questionId: number

  selected: Option
  correct: boolean

  confidence: Confidence

  question: QuestionPreview
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

  priority: Priority

  lastConfidence: Confidence

  dueDate: string

  repetitions: number
  easeFactor: number
  interval: number

  question: FullQuestionView
}

export interface ReviewCardOutput {
  nextDueDays: number
  nextDueDate: string

  newInterval: number
  newEaseFactor: number
  newRepetitions: number
}
