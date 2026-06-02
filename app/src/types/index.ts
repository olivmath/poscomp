import type { Timestamp } from 'firebase/firestore'

export type Area = 'Matemática' | 'Fundamentos da Computação' | 'Tecnologia da Computação'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'
export type Confidence = 'unsure' | 'studying' | 'should_know' | null
export type QuestionStatus = 'unvisited' | 'skipped' | 'unsure' | 'studying' | 'should_know'

export interface Question {
  id: number
  ano: number
  area: Area
  enunciado: string
  alternativas: Record<Option, string>
  resposta: Option
  comentario?: string
  card?: {
    pergunta: string
    resposta: string // Markdown (supports LaTeX)
    solucao_md?: string
  }
}

export interface AnswerRecord {
  questionId: number
  selected: Option | null
  correct: boolean
  skipped: boolean
  confidence: Confidence
  issue?: {
    comment?: string
  }
}

export type QuestionReview = {
  id: number
  ano: number
  area?: Area
  enunciado: string
  alternativas: Record<Option, string>
  resposta: Option
  comentario?: string
  card?: {
    pergunta: string
    resposta: string
    solucao_md?: string
  }
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
  questionReviews?: QuestionReview[]
}

export type SimuladoState = 'idle' | 'config' | 'running' | 'finished'

export interface SrsCard {
  questionId: number
  easeFactor: number      // inicia em 2.5
  interval: number        // dias até próxima revisão
  repetitions: number     // nº de revisões bem-sucedidas consecutivas
  dueDate: Timestamp      // próxima data de revisão
  createdAt: Timestamp
  lastConfidence: Confidence | null
  studied: boolean        // usuário já estudou esse conteúdo?
  simuladoCorrect: boolean // foi acertado no simulado original?
}

export type Grade = 1 | 3 | 5

export type PremiumStatus = 'free' | 'pending' | 'premium'

export interface PremiumRequest {
  id: string
  uid: string
  status: 'pending' | 'approved' | 'denied'
  receiptUrl: string
  createdAt: import('firebase/firestore').Timestamp
  reviewedAt?: import('firebase/firestore').Timestamp
  reviewedBy?: string
}

export interface UserProfile {
  uid: string
  isPremium: boolean
  premiumSince?: import('firebase/firestore').Timestamp
}

export interface Announcement {
  id: string
  message: string
  active: boolean
  type: 'info' | 'warning' | 'success'
  url?: string | null
  createdAt: Timestamp
  expiresAt?: Timestamp | null
}
