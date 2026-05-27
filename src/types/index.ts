import type { Timestamp } from 'firebase/firestore'

export type Area = 'Matemática' | 'Algoritmos' | 'Lógica' | 'Banco de Dados' | 'Redes'
export type Difficulty = 'fácil' | 'médio' | 'difícil'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'
export type Confidence = 'unsure' | 'certain' | null
export type QuestionStatus = 'unvisited' | 'skipped' | 'unsure' | 'certain'

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
  skipped: boolean
  confidence: Confidence
}

export interface AreaBreakdown {
  correct: number
  total: number
}

export interface SimuladoConfig {
  areas: Area[] // [] = todas
  totalQuestions: 5 | 10 | 20 | number // number para o caso 'max'
  timerMode: 'none' | 'per-question'
  secondsPerQuestion?: number
}

export interface SimuladoResult {
  id: string
  completedAt: Timestamp
  score: number
  totalQuestions: number
  timeSpentSeconds: number
  areaBreakdown: Record<Area, AreaBreakdown>
  answers: AnswerRecord[]
}

export type SimuladoState = 'idle' | 'config' | 'running' | 'finished'

export interface SrsCard {
  questionId: string
  easeFactor: number      // inicia em 2.5
  interval: number        // dias até próxima revisão
  repetitions: number     // nº de revisões bem-sucedidas consecutivas
  dueDate: Timestamp      // próxima data de revisão
  createdAt: Timestamp
  lastConfidence: Confidence | null
}

export type Grade = 1 | 3 | 5
