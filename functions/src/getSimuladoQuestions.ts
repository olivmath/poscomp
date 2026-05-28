import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

import { db } from './index'

import { VALID_AREAS } from './types'

import type {
  Area,
  Question,
  GetSimuladoQuestionsInput,
} from './types'

// ─── MAIN ────────────────────────────────────────────────────────

export const getSimuladoQuestions = onCall(async (request) => {
  logger.info('getSimuladoQuestions started', {
    uid: request.auth?.uid,
  })

  const uid = unwrapO(
    getAuthUid(request),
    new HttpsError('unauthenticated', 'Login required'),
  )

  const input = unwrapE(
    parseInput(request.data),
    (e) => new HttpsError('invalid-argument', e.message),
  )

  const questions = await fetchQuestions(input.areas)

  const selected = shuffleAndSlice(
    questions,
    input.total,
  )

  logger.info('getSimuladoQuestions finished', {
    uid,
    selected: selected.length,
  })

  return {
    questions: selected,
  }
})

///// AUX FUNCTIONS

function getAuthUid(request: { auth?: { uid: string } }): O.Option<string> {
  return O.fromNullable(request.auth?.uid)
}

function parseInput(
  data: unknown,
): E.Either<{ message: string }, GetSimuladoQuestionsInput> {
  const input = data as GetSimuladoQuestionsInput

  if (!Number.isInteger(input.total) || input.total <= 0) {
    return E.left({
      message: 'total must be a positive integer',
    })
  }

  const invalidAreas = input.areas.filter(
    (area) => !VALID_AREAS.includes(area),
  )

  if (invalidAreas.length > 0) {
    return E.left({
      message: `Invalid areas: ${invalidAreas.join(', ')}`,
    })
  }

  return E.right(input)
}

async function fetchQuestions(areas: Area[]): Promise<Question[]> {
  const collection = db.collection('questions')

  const snapshot = await (
    areas.length > 0
      ? collection
          .where('area', 'in', areas)
          .get()
      : collection.get()
  ).catch((e: unknown) => {
    throw new HttpsError(
      'internal',
      'Questions fetch failed',
      e,
    )
  })

  if (snapshot.empty) {
    throw new HttpsError(
      'not-found',
      'No questions found for the given areas',
    )
  }

  return snapshot.docs.map((doc) => {
    return doc.data() as Question
  })
}


function shuffleAndSlice(
  questions: Question[],
  total: number,
): Question[] {
  const shuffled = [...questions].sort(
    () => Math.random() - 0.5,
  )

  return shuffled.slice(0, total)
}

///// UNWRAP HELPERS

function unwrapO<T>(opt: O.Option<T>, raise: Error): T {
  return pipe(
    opt,
    O.getOrElseW(() => {
      throw raise
    }),
  )
}

function unwrapE<E extends { message: string }, T>(
  either: E.Either<E, T>,
  toError: (e: E) => Error,
): T {
  return pipe(
    either,
    E.getOrElseW((e) => {
      throw toError(e)
    }),
  )
}
