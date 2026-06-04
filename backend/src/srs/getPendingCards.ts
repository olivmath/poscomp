import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requirePremium } from '../utils/auth'
import { SrsCard, Question, Confidence } from '../types'
import { chunkArray } from '../utils/chunks'

export const getPendingCards = onCall(async (request) => {
  const auth = await requirePremium(request)
  console.log('getPendingCards started', { uid: auth.uid })

  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  let snap: FirebaseFirestore.QuerySnapshot
  try {
    snap = await db
      .collection(`users/${auth.uid}/srs_cards`)
      .where('dueDate', '<=', now)
      .get()
  } catch (e) {
    throw new HttpsError('internal', 'Firestore error')
  }

  const filtered = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as SrsCard & { id: string }))
    .filter((c) => c.lastConfidence === 'should_know' || c.lastConfidence === 'studying')

  // Fetch questions in chunks
  const questionIds = filtered.map((c) => c.questionId)
  const questionMap = new Map<number, Question>()
  if (questionIds.length > 0) {
    const chunks = chunkArray(questionIds, 30)
    for (const chunk of chunks) {
      const docRefs = chunk.map((id) => db.doc(`questions/${id}`))
      const docSnaps = await db.getAll(...docRefs)
      for (const d of docSnaps) {
        if (d.exists) {
          const q = d.data() as Question
          questionMap.set(q.id, q)
        }
      }
    }
  }

  const priorityMap: Record<Confidence, 'P1' | 'P2' | 'P3'> = {
    should_know: 'P1',
    studying: 'P2',
    unsure: 'P3',
  }

  const cards = filtered
    .map((c) => ({
      questionId: c.questionId,
      priority: priorityMap[c.lastConfidence],
      lastConfidence: c.lastConfidence,
      dueDate: c.dueDate.toDate().toISOString(),
      repetitions: c.repetitions,
      easeFactor: c.easeFactor,
      interval: c.interval,
      question: questionMap.get(c.questionId) ?? null,
    }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  console.log('getPendingCards finished', { uid: auth.uid, count: cards.length })
  return { cards }
})
