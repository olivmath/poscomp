export type Materia = 'Matemática' | 'Computação' | 'Tecnologias'
export type Option = 'A' | 'B' | 'C' | 'D' | 'E'
export type PlanType = 'free' | 'pro' | 'pro_max'
export type PremiumStatus = 'awaiting_receipt' | 'pending' | 'approved' | 'denied'
export type AnnouncementType = 'info' | 'warning' | 'success'

export interface AdminDashboard {
  totalUsers: number
  usersByPlan: { free: number; pro: number; pro_max: number }
  dau: number
  wau: number
  mau: number
  retention: { d1: number; d7: number; d30: number }
  premiumFunnel: {
    total: number
    pending: number
    approved: number
    denied: number
    approvalRatePct: number
    avgApprovalTimeHours: number
  }
  premiumExpiringIn7Days: number
  premiumExpiringIn30Days: number
  expiredPremium: number
  computedAt: { toDate(): Date } | { _seconds: number; _nanoseconds: number } | { seconds: number; nanoseconds: number } | string
}

export interface AdminUser {
  uid: string
  email: string
  displayName: string
  photoURL: string
  disabled: boolean
  isAdmin: boolean
  isPremium: boolean
  planType: PlanType
  premiumExpiresAt?: { toDate(): Date } | string | null
  createdAt: string
  lastSignIn: string
}

export interface Question {
  id: number
  ano: number
  materia: Materia
  enunciado: string
  alternativas: Record<Option, string>
  resposta: Option
  comentario: string
  card?: { pergunta: string; resposta: string }
}

export interface FlaggedQuestion {
  id: string
  questionId: number
  comment: string
  uid: string
  resultId?: string
  resolved: boolean
  createdAt: string
  resolvedAt?: string
}

export interface PremiumRequest {
  id: string
  uid: string
  planType: PlanType
  status: PremiumStatus
  storagePath?: string
  receiptType?: string
  createdAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface Announcement {
  id: string
  message: string
  type: AnnouncementType
  active: boolean
  url?: string | null
  expiresAt?: string | null
  createdAt: string
}
