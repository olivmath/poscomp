import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { db } from './index'
import { VALID_AREAS } from './types'
import type { Area, Question, GetSimuladoQuestionsInput } from './types'

export const getSimuladoQuestions = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

  const input = request.data as GetSimuladoQuestionsInput
  const { areas, total } = input

  validateInput(areas, total)

  const questions = await fetchQuestions(areas)
  const selected = shuffleAndSlice(questions, total)

  return { questions: selected }
})

async function fetchQuestions(areas: Area[]): Promise<Question[]> {
  const col = db.collection('questions')

  const snapshot =
    areas.length > 0
      ? await col.where('area', 'in', areas).get()
      : await col.get()

  if (snapshot.empty) throw new HttpsError('not-found', 'No questions found for the given areas')

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Question))
}

function validateInput(areas: Area[], total: number): void {
  if (!Number.isInteger(total) || total <= 0) {
    throw new HttpsError('invalid-argument', 'total must be a positive integer')
  }

  const invalidAreas = areas.filter((a) => !VALID_AREAS.includes(a))
  if (invalidAreas.length > 0) {
    throw new HttpsError('invalid-argument', `Invalid areas: ${invalidAreas.join(', ')}`)
  }
}

function shuffleAndSlice(questions: Question[], total: number): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, total)
}
