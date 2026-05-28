import type { Timestamp } from 'firebase-admin/firestore'

export type Area = 'Matemática' | 'Fundamentos da Computação' | 'Tecnologia da Computação'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'
export type Confidence = 'unsure' | 'studying' | 'should_know'

export const VALID_AREAS: Area[] = [
  'Matemática',
  'Fundamentos da Computação',
  'Tecnologia da Computação',
]

export const VALID_OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']
export const VALID_CONFIDENCES: Confidence[] = ['unsure', 'studying', 'should_know']

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

// Input types
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

// Output types
export interface AreaBreakdown {
  correct: number
  total: number
}

export interface AnswerOutput {
  questionId: number
  selected: Option
  correct: boolean
  confidence: Confidence
  question: {
    enunciado: string
    alternativas: Record<Option, string>
    resposta: Option
    comentario?: string
  }
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
  lastConfidence: Confidence
  dueDate: string
  repetitions: number
  easeFactor: number
  interval: number
  question: {
    id: number
    ano: number
    area: Area
    enunciado: string
    alternativas: Record<Option, string>
    resposta: Option
    comentario?: string
  }
}

export interface ReviewCardOutput {
  nextDueDays: number
  nextDueDate: string
  newInterval: number
  newEaseFactor: number
  newRepetitions: number
}
