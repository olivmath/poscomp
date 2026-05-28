import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

import { db } from './index'

import { VALID_OPTIONS, VALID_CONFIDENCES } from './types'

import type {
  Area,
  Option,
  Confidence,
  Question,
  AnswerInput,
  FinishSimuladoInput,
  FinishSimuladoOutput,
  AreaBreakdown,
  AnswerOutput,
} from './types'

// ─── MAIN ────────────────────────────────────────────────────────

export const finishSimulado = onCall(async (request) => {
  logger.info('finishSimulado started', { uid: request.auth?.uid })

  const uid   = unwrapO(getAuthUid(request), new HttpsError('unauthenticated', 'Login required'))
  const input = unwrapE(parseInput(request.data), (e) => new HttpsError('invalid-argument', e.message))

  const questionsMap = await fetchQuestionsMap(getQuestionIds(input.answers))

  const answersOutput = buildAnswersOutput(input.answers, questionsMap)
  const areaBreakdown = buildAreaBreakdown(answersOutput, questionsMap)

  const score = answersOutput.filter((a) => a.correct).length

  const resultId = await saveResult(uid, {
    answers: answersOutput,
    areaBreakdown,
    score,
    totalQuestions: input.answers.length,
    timeSpentSeconds: input.timeSpentSeconds,
  })

  await updateSrsCards(uid, input.answers, questionsMap)

  logger.info('finishSimulado finished', {
    uid,
    resultId,
    score,
  })

  return {
    resultId,
    score,
    totalQuestions: input.answers.length,
    timeSpentSeconds: input.timeSpentSeconds,
    areaBreakdown,
    answers: answersOutput,
  } satisfies FinishSimuladoOutput
})

///// AUX FUNCTIONS

function getAuthUid(request: { auth?: { uid: string } }): O.Option<string> {
  return O.fromNullable(request.auth?.uid)
}

function parseInput(data: unknown): E.Either<{ message: string }, FinishSimuladoInput> {
  const input = data as FinishSimuladoInput

  if (!Array.isArray(input.answers) || input.answers.length === 0) {
    return E.left({ message: 'answers must be a non-empty array' })
  }

  if (typeof input.timeSpentSeconds !== 'number' || input.timeSpentSeconds < 0) {
    return E.left({ message: 'timeSpentSeconds must be >= 0' })
  }

  for (const answer of input.answers) {
    if (!VALID_OPTIONS.includes(answer.selected)) {
      return E.left({ message: `Invalid option: ${answer.selected}` })
    }

    if (!VALID_CONFIDENCES.includes(answer.confidence)) {
      return E.left({ message: `Invalid confidence: ${answer.confidence}` })
    }

    if (!Number.isInteger(answer.questionId) || answer.questionId <= 0) {
      return E.left({
        message: 'Each answer must have a valid questionId (positive integer)',
      })
    }
  }

  return E.right(input)
}

function getQuestionIds(answers: AnswerInput[]): number[] {
  return answers.map((a) => a.questionId)
}

async function fetchQuestionsMap(questionIds: number[]): Promise<Map<number, Question>> {
  const chunks = chunkArray(questionIds, 30)

  const map = new Map<number, Question>()

  for (const chunk of chunks) {
    const snapshot = await db
      .collection('questions')
      .where('__name__', 'in', chunk.map(String))
      .get()
      .catch((e) => {
        throw new HttpsError('internal', 'Questions fetch failed', e)
      })

    for (const doc of snapshot.docs) {
      const question = doc.data() as Question
      map.set(question.id, question)
    }
  }

  const missing = questionIds.filter((id) => !map.has(id))

  if (missing.length > 0) {
    throw new HttpsError('not-found', `Questions not found: ${missing.join(', ')}`)
  }

  return map
}

function buildAnswersOutput(
  answers: AnswerInput[],
  questionsMap: Map<number, Question>,
): AnswerOutput[] {
  return answers.map((answer) => {
    const question = questionsMap.get(answer.questionId)!

    const correct = answer.selected === question.resposta

    const questionOut: AnswerOutput['question'] = {
      enunciado: question.enunciado,
      alternativas: question.alternativas,
      resposta: question.resposta,
      ...(question.comentario !== undefined
        ? { comentario: question.comentario }
        : {}),
    }

    return {
      questionId: answer.questionId,
      selected: answer.selected,
      confidence: answer.confidence,
      correct,
      question: questionOut,
    }
  })
}

function buildAreaBreakdown(
  answersOutput: AnswerOutput[],
  questionsMap: Map<number, Question>,
): Record<Area, AreaBreakdown> {
  const breakdown: Partial<Record<Area, AreaBreakdown>> = {}

  for (const answer of answersOutput) {
    const question = questionsMap.get(answer.questionId)!

    const area = question.area

    if (!breakdown[area]) {
      breakdown[area] = {
        correct: 0,
        total: 0,
      }
    }

    const entry = breakdown[area]!

    entry.total += 1

    if (answer.correct) {
      entry.correct += 1
    }
  }

  return breakdown as Record<Area, AreaBreakdown>
}

async function saveResult(
  uid: string,
  data: Omit<FinishSimuladoOutput, 'resultId'>,
): Promise<string> {
  const ref = await db
    .collection(`users/${uid}/results`)
    .add({
      ...data,
      completedAt: FieldValue.serverTimestamp(),
    })
    .catch((e) => {
      throw new HttpsError('internal', 'Result save failed', e)
    })

  return ref.id
}

async function updateSrsCards(
  uid: string,
  answers: AnswerInput[],
  questionsMap: Map<number, Question>,
): Promise<void> {
  const batch = db.batch()

  const now = Timestamp.now()

  for (const answer of answers) {
    const question = questionsMap.get(answer.questionId)!

    const correct = answer.selected === question.resposta

    const cardRef  = db.doc(`users/${uid}/srs_cards/${answer.questionId}`)
    const cardSnap = await cardRef.get()

    if (cardSnap.exists) {
      batch.update(cardRef, {
        lastConfidence: answer.confidence,
        dueDate: now,
        simuladoCorrect: correct,
      })

      continue
    }

    batch.set(cardRef, {
      questionId: answer.questionId,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      dueDate: now,
      createdAt: now,
      lastConfidence: answer.confidence,
      studied: false,
      simuladoCorrect: correct,
    })
  }

  await batch.commit().catch((e) => {
    throw new HttpsError('internal', 'SRS cards update failed', e)
  })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }

  return chunks
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

///// RE-EXPORTS

export type { Option, Confidence }
