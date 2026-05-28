import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { Timestamp } from 'firebase-admin/firestore'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { db } from './index'
import type { SrsCard, ReviewCardInput, ReviewCardOutput } from './types'

// ─── MAIN ────────────────────────────────────────────────────────
export const reviewCard = onCall(async (request) => {
  logger.info('reviewCard started', { uid: request.auth?.uid })

  const uid   = unwrapO(getAuthUid(request),    new HttpsError('unauthenticated', 'Login required'))
  const input = unwrapE(parseInput(request.data), (e) => new HttpsError('invalid-argument', e.message))
  const card  = await fetchCard(uid, input.questionId)
  const result = await persistReview(uid, input.questionId, card, input.studied)

  logger.info('reviewCard finished', { uid, questionId: input.questionId })
  return result
})

///// AUX FUNCTIONS

function getAuthUid(request: { auth?: { uid: string } }): O.Option<string> {
  return O.fromNullable(request.auth?.uid)
}

function parseInput(data: unknown): E.Either<{ message: string }, ReviewCardInput> {
  return pipe(
    data as ReviewCardInput,
    E.fromPredicate(
      (d) => Number.isInteger(d.questionId) && d.questionId > 0,
      () => ({ message: 'questionId must be a positive integer' })
    )
  )
}

async function fetchCard(uid: string, questionId: number): Promise<SrsCard> {
  const ref  = db.doc(`users/${uid}/srs_cards/${questionId}`)
  const snap = await ref.get().catch((e) => { throw new HttpsError('internal', 'DB read failed', e) })

  if (!snap.exists) throw new HttpsError('not-found', `SRS card not found: ${questionId}`)

  return snap.data() as SrsCard
}

async function persistReview(uid: string, questionId: number, card: SrsCard, studied: boolean): Promise<ReviewCardOutput> {
  const updated = applySm2(card, studied)
  const cardRef = db.doc(`users/${uid}/srs_cards/${questionId}`)

  await db.runTransaction(async (txn) => {
    txn.update(cardRef, {
      interval:    updated.newInterval,
      easeFactor:  updated.newEaseFactor,
      repetitions: updated.newRepetitions,
      dueDate:     Timestamp.fromDate(new Date(updated.nextDueDate)),
      studied:     true,
    })
  }).catch((e) => { throw new HttpsError('internal', 'DB write failed', e) })

  return updated
}

function applySm2(card: SrsCard, studied: boolean): ReviewCardOutput {
  let { interval, easeFactor, repetitions } = card

  if (studied) {
    interval    = Math.round(interval * easeFactor)
    easeFactor  = easeFactor + 0.1
    repetitions = repetitions + 1
  } else {
    interval    = 1
    easeFactor  = Math.max(1.3, easeFactor - 0.2)
    repetitions = 0
  }

  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + interval)

  return {
    nextDueDays:    interval,
    nextDueDate:    nextDueDate.toISOString(),
    newInterval:    interval,
    newEaseFactor:  easeFactor,
    newRepetitions: repetitions,
  }
}

///// UNWRAP HELPERS

function unwrapO<T>(opt: O.Option<T>, raise: Error): T {
  return pipe(opt, O.getOrElseW(() => { throw raise }))
}

function unwrapE<E extends { message: string }, T>(either: E.Either<E, T>, toError: (e: E) => Error): T {
  return pipe(either, E.getOrElseW((e) => { throw toError(e) }))
}
