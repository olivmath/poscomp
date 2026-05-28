import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { Timestamp } from 'firebase-admin/firestore'
import { db } from './index'
import type { SrsCard, ReviewCardInput, ReviewCardOutput } from './types'

export const reviewCard = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  const uid = request.auth.uid

  const { questionId, studied } = request.data as ReviewCardInput

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw new HttpsError('invalid-argument', 'questionId must be a positive integer')
  }

  const cardRef = db.doc(`users/${uid}/srs_cards/${questionId}`)

  return db.runTransaction(async (txn) => {
    const snap = await txn.get(cardRef)

    if (!snap.exists) {
      throw new HttpsError('not-found', `SRS card not found: ${questionId}`)
    }

    const card = snap.data() as SrsCard
    const updated = applySm2(card, studied)

    txn.update(cardRef, {
      interval: updated.newInterval,
      easeFactor: updated.newEaseFactor,
      repetitions: updated.newRepetitions,
      dueDate: Timestamp.fromDate(new Date(updated.nextDueDate)),
      studied: true,
    })

    return updated satisfies ReviewCardOutput
  })
})

function applySm2(card: SrsCard, studied: boolean): ReviewCardOutput {
  let { interval, easeFactor, repetitions } = card

  if (studied) {
    interval = Math.round(interval * easeFactor)
    easeFactor = easeFactor + 0.1
    repetitions = repetitions + 1
  } else {
    interval = 1
    easeFactor = Math.max(1.3, easeFactor - 0.2)
    repetitions = 0
  }

  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + interval)

  return {
    nextDueDays: interval,
    nextDueDate: nextDueDate.toISOString(),
    newInterval: interval,
    newEaseFactor: easeFactor,
    newRepetitions: repetitions,
  }
}
