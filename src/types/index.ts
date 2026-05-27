import type { Timestamp } from 'firebase/firestore'

export type Area = 'Matemática' | 'Algoritmos' | 'Lógica' | 'Banco de Dados' | 'Redes'
export type Difficulty = 'fácil' | 'médio' | 'difícil'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'

export interface Question {
  id: string
  text: string
  options: Record<Option, string>
  correctOption: Option
  area: Area
  difficulty: Difficulty
}

export interface AnswerRecord {
  questionId: string
  selected: Option | null
  correct: boolean
}

export interface AreaBreakdown {
  correct: number
  total: number
}

export interface SimuladoResult {
  id: string
  completedAt: Timestamp
  score: number
  totalQuestions: 10
  timeSpentSeconds: number
  areaBreakdown: Record<Area, AreaBreakdown>
  answers: AnswerRecord[]
}

export type SimuladoState = 'idle' | 'running' | 'finished'
