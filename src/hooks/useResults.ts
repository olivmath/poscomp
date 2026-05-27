import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import type { Area, SimuladoResult } from '../types'

interface AreaStats {
  correct: number
  total: number
  pct: number
}

interface Analytics {
  totalSimulados: number
  overallAccuracy: number
  bestArea: Area | null
  worstArea: Area | null
  byArea: Partial<Record<Area, AreaStats>>
  recentScores: Array<{ score: number; total: number; date: Date }>
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
        })
      })
      .catch(() => {
        setError('Erro ao carregar resultados. Verifique sua conexão.')
      })
      .finally(() => setLoading(false))
  }, [user])

  return { results, analytics, loading, error }
}
