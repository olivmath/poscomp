import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requirePremium } from '../utils/auth'
import { Materia } from '../types'

export const getHistorico = onCall(async (request) => {
  const auth = await requirePremium(request)
  console.log('getHistorico started', { uid: auth.uid })

  const db = admin.firestore()
  let snap: FirebaseFirestore.QuerySnapshot
  try {
    snap = await db
      .collection(`users/${auth.uid}/results`)
      .orderBy('completedAt', 'desc')
      .get()
  } catch (e) {
    throw new HttpsError('internal', 'Firestore error')
  }

  const results = snap.docs.map((d) => {
    const data = d.data()
    return {
      resultId: d.id,
      score: data['score'] as number,
      totalQuestions: data['totalQuestions'] as number,
      completedAt: data['completedAt']?.toDate().toISOString() ?? new Date().toISOString(),
      materiaBreakdown: data['materiaBreakdown'] as Record<Materia, { correct: number; total: number }>,
    }
  })

  // Trend: delta % vs anterior
  let trend: number | null = null
  if (results.length >= 2) {
    const latest = results[0].score / results[0].totalQuestions
    const prev = results[1].score / results[1].totalQuestions
    trend = Math.round((latest - prev) * 100)
  }

  // byMateria aggregate
  const byMateria: Record<string, { correct: number; total: number }> = {}
  for (const r of results) {
    for (const [m, stats] of Object.entries(r.materiaBreakdown)) {
      if (!byMateria[m]) byMateria[m] = { correct: 0, total: 0 }
      byMateria[m].correct += stats.correct
      byMateria[m].total += stats.total
    }
  }

  // Streak: consecutive days up to today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activeDatesSet = new Set(
    results.map((r) => r.completedAt.split('T')[0])
  )
  let streak = 0
  const check = new Date(today)
  while (activeDatesSet.has(check.toISOString().split('T')[0])) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  // activeDaysThisWeek
  const activeDaysThisWeek: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (activeDatesSet.has(ds)) activeDaysThisWeek.push(ds)
  }

  console.log('getHistorico finished', { uid: auth.uid, count: results.length })
  return { results, trend, byMateria, streak, activeDaysThisWeek }
})
