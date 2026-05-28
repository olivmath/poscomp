import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import type { Area, SimuladoResult } from '../types'

interface AreaStats {
  correct: number
  total: number
  pct: number
}

interface ConfidenceStats {
  certainAccuracy: number
  unsureAccuracy: number
  shouldKnowAccuracy: number
  skipRate: number
}

interface AreaConfidenceStats {
  certainCorrect: number
  certainWrong: number
  unsureCorrect: number
  total: number
}

interface Analytics {
  totalSimulados: number
  overallAccuracy: number
  bestArea: Area | null
  worstArea: Area | null
  byArea: Partial<Record<Area, AreaStats>>
  recentScores: Array<{ score: number; total: number; date: Date }>
  confidenceStats: ConfidenceStats
  areaConfidence: Partial<Record<Area, AreaConfidenceStats>>
  reviewPriority: Area[]
  canRelax: Area[]
  streak: number
  weeklyFrequency: number // % de dias na semana com atividade
}

interface UseResultsReturn {
  results: SimuladoResult[]
  analytics: Analytics | null
  loading: boolean
  error: string | null
}

const AREAS: Area[] = ['Matemática', 'Algoritmos', 'Lógica', 'Banco de Dados', 'Redes']

export function useResults(): UseResultsReturn {
  const { user } = useAuth()
  const [results, setResults] = useState<SimuladoResult[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'results'),
      orderBy('completedAt', 'desc')
    )

    getDocs(q)
      .then((snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SimuladoResult[]

        setResults(docs)

        if (docs.length === 0) {
          setAnalytics(null)
          return
        }

        // ── aggregate by area ────────────────────────────────────────────
        const byArea: Partial<Record<Area, AreaStats>> = {}
        for (const area of AREAS) {
          byArea[area] = { correct: 0, total: 0, pct: 0 }
        }

        let totalCorrect = 0
        let totalAnswered = 0

        for (const r of docs) {
          for (const area of AREAS) {
            const b = r.areaBreakdown?.[area]
            if (!b) continue
            byArea[area]!.correct += b.correct
            byArea[area]!.total += b.total
            totalCorrect += b.correct
            totalAnswered += b.total
          }
        }

        for (const area of AREAS) {
          const s = byArea[area]!
          s.pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
        }

        // ── best/worst area ──────────────────────────────────────────────
        const areasWithData = AREAS.filter((a) => (byArea[a]?.total ?? 0) > 0)
        let bestArea: Area | null = null
        let worstArea: Area | null = null

        if (areasWithData.length > 0) {
          bestArea = areasWithData.reduce((a, b) =>
            (byArea[a]?.pct ?? 0) >= (byArea[b]?.pct ?? 0) ? a : b
          )
          worstArea = areasWithData.reduce((a, b) =>
            (byArea[a]?.pct ?? 0) <= (byArea[b]?.pct ?? 0) ? a : b
          )
        }

        // ── recent scores (last 5) ───────────────────────────────────────
        const recentScores = docs.slice(0, 5).map((r) => ({
          score: r.score,
          total: r.totalQuestions,
          date: r.completedAt?.toDate ? r.completedAt.toDate() : new Date(),
        }))

        // ── streak & frequency ───────────────────────────────────────────
        const dates = docs.map(d => {
          const dt = d.completedAt?.toDate ? d.completedAt.toDate() : new Date()
          return dt.toISOString().split('T')[0]
        })
        const uniqueDates = Array.from(new Set(dates)).sort().reverse()
        
        let streak = 0
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1
          for (let i = 0; i < uniqueDates.length - 1; i++) {
            const d1 = new Date(uniqueDates[i])
            const d2 = new Date(uniqueDates[i+1])
            const diff = (d1.getTime() - d2.getTime()) / 86400000
            if (diff === 1) streak++
            else break
          }
        }

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - i)
          return d.toISOString().split('T')[0]
        })
        const daysWithActivity = last7Days.filter(d => dates.includes(d)).length
        const weeklyFrequency = Math.round((daysWithActivity / 7) * 100)

        // ── confidence stats ─────────────────────────────────────────────
        const allAnswers = docs.flatMap((r) => r.answers ?? [])
        const totalAnswersCount = allAnswers.length

        const shouldKnowAnswers = allAnswers.filter((a) => a.confidence === 'should_know' && !a.skipped)
        const unsureAnswers     = allAnswers.filter((a) => a.confidence === 'unsure'     && !a.skipped)
        const skippedAnswers = allAnswers.filter((a) => a.skipped)

        const certainAccuracy = shouldKnowAnswers.length > 0
          ? Math.round((shouldKnowAnswers.filter((a) => a.correct).length / shouldKnowAnswers.length) * 100)
          : 0
        const unsureAccuracy = unsureAnswers.length > 0
          ? Math.round((unsureAnswers.filter((a) => a.correct).length / unsureAnswers.length) * 100)
          : 0
        const shouldKnowAccuracy = certainAccuracy
        const skipRate = totalAnswersCount > 0
          ? Math.round((skippedAnswers.length / totalAnswersCount) * 100)
          : 0

        // ── area confidence ──────────────────────────────────────────────
        const areaConfidence: Partial<Record<Area, AreaConfidenceStats>> = {}
        for (const area of AREAS) {
          areaConfidence[area] = { certainCorrect: 0, certainWrong: 0, unsureCorrect: 0, total: 0 }
        }

        for (const r of docs) {
          for (const answer of r.answers ?? []) {
            if (answer.skipped) continue
            // find the area for this answer via question data is not available here —
            // we use areaBreakdown per result instead; skip per-answer area mapping
          }
        }

        // ── area confidence from areaBreakdown + answers cross-reference ─
        // Since answers don't carry area directly, aggregate per-result via
        // a question lookup is unavailable. We compute from available data:
        // iterate docs, and for each result that has both answers and areaBreakdown,
        // distribute confidence signals proportionally. This is an approximation.
        // If future QuestionId→Area lookup is added, replace this block.
        for (const r of docs) {
          if (!r.answers?.length) continue
          const nonSkipped = r.answers.filter((a) => !a.skipped)
          for (const area of AREAS) {
            const b = r.areaBreakdown?.[area]
            if (!b || b.total === 0) continue
            const areaShare = b.total / r.totalQuestions
            const areaAnswers = nonSkipped.slice(0, Math.round(nonSkipped.length * areaShare))
            const ac = areaConfidence[area]!
            ac.total += b.total
            const certAns = areaAnswers.filter((a) => a.confidence === 'should_know')
            const certCorrect = Math.round((certAns.filter((a) => a.correct).length / Math.max(certAns.length, 1)) * b.correct)
            ac.certainCorrect += certCorrect
            ac.certainWrong   += Math.max(0, certAns.length - certCorrect)
            const unsureAns = areaAnswers.filter((a) => a.confidence === 'unsure')
            ac.unsureCorrect  += unsureAns.filter((a) => a.correct).length
          }
        }

        // ── review priority ──────────────────────────────────────────────
        const reviewPriority = areasWithData.slice().sort((a, b) => {
          const statsA = byArea[a]!
          const statsB = byArea[b]!
          const scoreA = statsA.total > 0 ? (statsA.total - statsA.correct) / statsA.total : 0
          const scoreB = statsB.total > 0 ? (statsB.total - statsB.correct) / statsB.total : 0
          return scoreB - scoreA
        })

        // ── can relax ────────────────────────────────────────────────────
        const canRelax = areasWithData.filter((area) => {
          const ac = areaConfidence[area]!
          const areaStats = byArea[area]!
          const certainRate = ac.total > 0
            ? (ac.certainCorrect / ac.total) * 100
            : 0
          return certainRate >= 70 && areaStats.pct >= 80
        })

        setAnalytics({
          totalSimulados: docs.length,
          overallAccuracy:
            totalAnswered > 0
              ? Math.round((totalCorrect / totalAnswered) * 100)
              : 0,
          bestArea,
          worstArea,
          byArea,
          recentScores,
          confidenceStats: { certainAccuracy, unsureAccuracy, shouldKnowAccuracy, skipRate },
          areaConfidence,
          reviewPriority,
          canRelax,
          streak,
          weeklyFrequency,
        })
      })
      .catch(() => {
        setError('Erro ao carregar resultados. Verifique sua conexão.')
      })
      .finally(() => setLoading(false))
  }, [user])

  return { results, analytics, loading, error }
}
