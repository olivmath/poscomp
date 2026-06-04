export type Materia = 'Matemática' | 'Computação' | 'Tecnologias'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'
export type Confidence = 'unsure' | 'studying' | 'should_know'

export interface Question {
  id: number
  ano: number
  materia: Materia
  enunciado: string
  alternativas: Record<Option, string>
  resposta: Option
  comentario: string
  card: { pergunta: string; resposta: string }
}

export interface SimuladoConfig {
  materias: Materia[]
  total: number
  timerMode: 'none' | '1min' | '2min'
}

export interface SimuladoAnswer {
  questionId: number
  selected: Option | null
  confidence: Confidence | null
  skipped: boolean
}

export interface SimuladoResult {
  resultId: string
  score: number
  totalQuestions: number
  timeSpentSeconds: number
  materiaBreakdown: Record<string, { correct: number; total: number }>
  answers: Array<{
    questionId: number
    selected: Option
    correct: boolean
    confidence: Confidence
    question: Question
  }>
}

export interface UserDoc {
  isPremium: boolean
  planType: 'free' | 'pro' | 'pro_max'
  premiumStatus: 'free' | 'pending' | 'active'
  premiumExpiresAt?: { toDate(): Date }
  lastActivity?: { toDate(): Date }
  activeDays?: string[]
  notificationsEnabled?: boolean
}

export interface SrsCard {
  questionId: number
  priority: 'P1' | 'P2'
  lastConfidence: Confidence
  dueDate: string
  repetitions: number
  easeFactor: number
  interval: number
  question: Question
}

export interface HistoricoResult {
  resultId: string
  score: number
  totalQuestions: number
  completedAt: string
  materiaBreakdown: Record<string, { correct: number; total: number }>
}
