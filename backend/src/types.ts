import * as FirebaseFirestore from 'firebase-admin/firestore'

export type Materia = 'Matemática' | 'Computação' | 'Tecnologias'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'
export type Confidence = 'unsure' | 'studying' | 'should_know'

export const VALID_MATERIAS: Materia[] = ['Matemática', 'Computação', 'Tecnologias']
export const VALID_OPTIONS: Option[] = ['A', 'B', 'C', 'D', 'E']
export const VALID_CONFIDENCES: Confidence[] = ['unsure', 'studying', 'should_know']

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

export interface SrsCard {
  questionId: number
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: FirebaseFirestore.Timestamp
  createdAt: FirebaseFirestore.Timestamp
  lastConfidence: Confidence
  studied: boolean
  simuladoCorrect: boolean
  materia: Materia
}

export interface UserDocument {
  isPremium: boolean
  planType: 'free' | 'pro' | 'pro_max'
  premiumStatus: 'free' | 'pending' | 'active'
  premiumExpiresAt?: FirebaseFirestore.Timestamp
  createdAt: FirebaseFirestore.Timestamp
  lastActivity: FirebaseFirestore.Timestamp
  activeDays: string[]
  notificationsEnabled: boolean
  fcmTokens: string[]
}

export interface SimuladoResult {
  score: number
  totalQuestions: number
  timeSpentSeconds: number
  completedAt: FirebaseFirestore.Timestamp
  materiaBreakdown: Record<string, { correct: number; total: number }>
  answers: Array<{
    questionId: number
    selected: Option
    correct: boolean
    confidence: Confidence
    question: {
      id: number
      materia: string
      enunciado: string
      alternativas: Record<string, string>
      resposta: string
      comentario: string
    }
  }>
}

export interface PremiumRequest {
  uid: string
  status: 'awaiting_receipt' | 'pending' | 'approved' | 'denied'
  planType: 'pro' | 'pro_max'
  storagePath?: string
  receiptType?: string
  createdAt: FirebaseFirestore.Timestamp
  submittedAt?: FirebaseFirestore.Timestamp
  reviewedAt?: FirebaseFirestore.Timestamp
  reviewedBy?: string
}

export interface FlaggedQuestion {
  uid: string
  questionId: number
  resultId?: string
  comment: string
  resolved: boolean
  createdAt: FirebaseFirestore.Timestamp
  resolvedAt?: FirebaseFirestore.Timestamp
}

export interface Announcement {
  message: string
  type: 'info' | 'warning' | 'success'
  active: boolean
  url: string
  createdAt: FirebaseFirestore.Timestamp
  expiresAt: FirebaseFirestore.Timestamp | null
}
