import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { Timestamp } from 'firebase-admin/firestore'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { db } from './index'

import type {
  Area,
  Option,
  Confidence,
  Question,
  SrsCard,
  PendingCardOutput,
} from './types'

// ─── MAIN ────────────────────────────────────────────────────────

export const getPendingCards = onCall(async (request) => {
  logger.info('getPendingCards started', { uid: request.auth?.uid })

  const uid = unwrapO(
    getAuthUid(request),
    new HttpsError('unauthenticated', 'Login required'),
  )

  const dueCards = await fetchDueCards(uid)

  if (dueCards.length === 0) {
    logger.info('getPendingCards finished', {
      uid,
      cards: 0,
    })

    return { cards: [] }
  }

  const questionIds = getQuestionIds(dueCards)

  const questionsMap = await fetchQuestionsMap(questionIds)

  const cards = buildOutput(dueCards, questionsMap)

  logger.info('getPendingCards finished', {
    uid,
    cards: cards.length,
  })

  return { cards }
})

///// AUX FUNCTIONS

function getAuthUid(request: { auth?: { uid: string } }): O.Option<string> {
  return O.fromNullable(request.auth?.uid)
}

async function fetchDueCards(uid: string): Promise<SrsCard[]> {
  const now = Timestamp.now()

  const snapshot = await db
    .collection(`users/${uid}/srs_cards`)
    .where('dueDate', '<=', now)
    .get()
    .catch((e) => {
      throw new HttpsError('internal', 'Due cards fetch failed', e)
    })

  return snapshot.docs.map((doc) => doc.data() as SrsCard)
}

function getQuestionIds(cards: SrsCard[]): number[] {
  return cards.map((c) => c.questionId)
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

  return map
}

function buildOutput(
  cards: SrsCard[],
  questionsMap: Map<number, Question>,
): PendingCardOutput[] {
  const withPriority = cards
    .filter((card) => card.lastConfidence !== null)
    .map((card) => ({
      card,
      priority: confidenceToPriority(card.lastConfidence as Confidence),
    }))

  withPriority.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority.localeCompare(b.priority)
    }

    return a.card.dueDate.toMillis() - b.card.dueDate.toMillis()
  })

  return withPriority
    .filter(({ card }) => questionsMap.has(card.questionId))
    .map(({ card, priority }) => {
      const question = questionsMap.get(card.questionId)!

      const questionOut: PendingCardOutput['question'] = {
        id: question.id,
        ano: question.ano,
        area: question.area as Area,
        enunciado: question.enunciado,
        alternativas: question.alternativas as Record<Option, string>,
        resposta: question.resposta as Option,
        ...(question.comentario !== undefined
          ? { comentario: question.comentario }
          : {}),
        ...(question.card !== undefined
          ? { card: question.card }
          : {}),
      }

      return {
        questionId: card.questionId,
        priority,
        lastConfidence: card.lastConfidence as Confidence,
        dueDate: card.dueDate.toDate().toISOString(),
        repetitions: card.repetitions,
        easeFactor: card.easeFactor,
        interval: card.interval,
        question: questionOut,
      }
    })
}

function confidenceToPriority(confidence: Confidence): 'P1' | 'P2' | 'P3' {
  switch (confidence) {
    case 'should_know':
      return 'P1'

    case 'studying':
      return 'P2'

    case 'unsure':
      return 'P3'
  }
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
