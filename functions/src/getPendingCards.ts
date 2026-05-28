import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { Timestamp } from 'firebase-admin/firestore'
import { db } from './index'
import type { Area, Option, Confidence, Question, SrsCard, PendingCardOutput } from './types'

export const getPendingCards = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  const uid = request.auth.uid

  const dueCards = await fetchDueCards(uid)
  if (dueCards.length === 0) return { cards: [] }

  const questionIds = dueCards.map((c) => c.questionId)
  const questionsMap = await fetchQuestionsMap(questionIds)

  const cards = buildOutput(dueCards, questionsMap)

  return { cards }
})

async function fetchDueCards(uid: string): Promise<SrsCard[]> {
  const now = Timestamp.now()
  const snapshot = await db
    .collection(`users/${uid}/srs_cards`)
    .where('dueDate', '<=', now)
    .get()

  return snapshot.docs.map((doc) => doc.data() as SrsCard)
}

async function fetchQuestionsMap(questionIds: number[]): Promise<Map<number, Question>> {
  const chunks = chunkArray(questionIds, 30)
  const map = new Map<number, Question>()

  for (const chunk of chunks) {
    const snapshot = await db.collection('questions').where('__name__', 'in', chunk.map(String)).get()
    for (const doc of snapshot.docs) {
      const q = doc.data() as Question
      map.set(q.id, q)
    }
  }

  return map
}

function buildOutput(cards: SrsCard[], questionsMap: Map<number, Question>): PendingCardOutput[] {
  const withPriority = cards
    .filter((c) => c.lastConfidence !== null)
    .map((card) => ({
      card,
      priority: confidenceToPriority(card.lastConfidence as Confidence),
    }))

  withPriority.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority.localeCompare(b.priority)
    return a.card.dueDate.toMillis() - b.card.dueDate.toMillis()
  })

  return withPriority
    .filter(({ card }) => questionsMap.has(card.questionId))
    .map(({ card, priority }) => {
      const q = questionsMap.get(card.questionId)!
      const questionOut: PendingCardOutput['question'] = {
        id: q.id,
        ano: q.ano,
        area: q.area as Area,
        enunciado: q.enunciado,
        alternativas: q.alternativas as Record<Option, string>,
        resposta: q.resposta as Option,
        ...(q.comentario !== undefined ? { comentario: q.comentario } : {}),
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
    case 'should_know': return 'P1'
    case 'studying': return 'P2'
    case 'unsure': return 'P3'
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
