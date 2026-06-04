import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requirePremium } from '../utils/auth'
import { applySm2 } from '../utils/sm2'

export const reviewCard = onCall(async (request) => {
  const auth = await requirePremium(request)
  const { questionId, studied } = request.data as { questionId: number; studied: boolean }

  console.log('reviewCard started', { uid: auth.uid, questionId, studied })

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw new HttpsError('invalid-argument', 'questionId must be a positive integer')
  }
  if (typeof studied !== 'boolean') {
    throw new HttpsError('invalid-argument', 'studied must be a boolean')
  }

  const db = admin.firestore()
  const cardRef = db.doc(`users/${auth.uid}/srs_cards/${questionId}`)

  const result = await db.runTransaction(async (tx) => {
    const cardSnap = await tx.get(cardRef)
    if (!cardSnap.exists) {
      throw new HttpsError('not-found', 'Card not found — question was never answered in a simulado')
    }

    const card = cardSnap.data()!
    const { interval, easeFactor, repetitions, nextDueDate } = applySm2(
      {
        interval: card['interval'] as number,
        easeFactor: card['easeFactor'] as number,
        repetitions: card['repetitions'] as number,
      },
      studied
    )

    const dueTimestamp = admin.firestore.Timestamp.fromDate(nextDueDate)
    const today = new Date().toISOString().split('T')[0]

    tx.update(cardRef, {
      interval,
      easeFactor,
      repetitions,
      dueDate: dueTimestamp,
      studied: true,
    })

    tx.set(
      db.doc(`users/${auth.uid}`),
      {
        lastActivity: FieldValue.serverTimestamp(),
        activeDays: FieldValue.arrayUnion(today),
      },
      { merge: true }
    )

    return { interval, easeFactor, repetitions, nextDueDate }
  })

  console.log('reviewCard finished', { uid: auth.uid, questionId, nextInterval: result.interval })
  return {
    nextDueDays: result.interval,
    nextDueDate: result.nextDueDate.toISOString(),
    newInterval: result.interval,
    newEaseFactor: result.easeFactor,
    newRepetitions: result.repetitions,
  }
})
