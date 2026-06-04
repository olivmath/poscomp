import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requireAuth } from '../utils/auth'

export const getMateriaReviewStats = onCall(async (request) => {
  const auth = requireAuth(request)
  console.log('getMateriaReviewStats started', { uid: auth.uid })

  const db = admin.firestore()

  let cardsSnap: FirebaseFirestore.QuerySnapshot
  let resultsSnap: FirebaseFirestore.QuerySnapshot
  try {
    ;[cardsSnap, resultsSnap] = await Promise.all([
      db.collection(`users/${auth.uid}/srs_cards`).get(),
      db.collection(`users/${auth.uid}/results`).get(),
    ])
  } catch (e) {
    throw new HttpsError('internal', 'Firestore error')
  }

  // Group cards by materia
  const materiaMinDueDate = new Map<string, Date>()
  for (const doc of cardsSnap.docs) {
    const card = doc.data()
    const materia: string = card['materia']
    const dueDate: Date = card['dueDate'].toDate()
    if (!materiaMinDueDate.has(materia) || dueDate < materiaMinDueDate.get(materia)!) {
      materiaMinDueDate.set(materia, dueDate)
    }
  }

  // Collect review dates per materia from results
  const materiaReviewDates = new Map<string, string[]>()
  for (const doc of resultsSnap.docs) {
    const result = doc.data()
    const completedAt: string = result['completedAt']?.toDate().toISOString().split('T')[0] ?? ''
    const breakdown = result['materiaBreakdown'] as Record<string, unknown>
    if (breakdown) {
      for (const materia of Object.keys(breakdown)) {
        if (!materiaReviewDates.has(materia)) materiaReviewDates.set(materia, [])
        if (completedAt) materiaReviewDates.get(materia)!.push(completedAt)
      }
    }
  }

  // Build output — only materias that have SRS cards
  const materias = Array.from(materiaMinDueDate.entries()).map(([materia, minDue]) => {
    const allDates = (materiaReviewDates.get(materia) ?? []).sort()
    const reviewDates = allDates.slice(-10) // last 10
    return {
      materia,
      reviewDates,
      nextDueDate: minDue.toISOString(),
    }
  })

  // Sort by nextDueDate ASC, nulls last (no nulls since all have SRS cards)
  materias.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())

  console.log('getMateriaReviewStats finished', { uid: auth.uid, materias: materias.length })
  return { materias }
})
