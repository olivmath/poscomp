import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
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

export const finishSimulado = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  const uid = request.auth.uid

  const input = request.data as FinishSimuladoInput
  validateInput(input)

  const { answers, timeSpentSeconds } = input

  const questionIds = answers.map((a) => a.questionId)
  const questionsMap = await fetchQuestionsMap(questionIds)

  const answersOutput = buildAnswersOutput(answers, questionsMap)
  const areaBreakdown = buildAreaBreakdown(answersOutput, questionsMap)
  const score = answersOutput.filter((a) => a.correct).length

  const resultId = await saveResult(uid, {
    answers: answersOutput,
    areaBreakdown,
    score,
    totalQuestions: answers.length,
    timeSpentSeconds,
  })

  await updateSrsCards(uid, answers, questionsMap)

  return {
    resultId,
    score,
    totalQuestions: answers.length,
    timeSpentSeconds,
    areaBreakdown,
    answers: answersOutput,
  } satisfies FinishSimuladoOutput
})

function validateInput(input: FinishSimuladoInput): void {
  const { answers, timeSpentSeconds } = input

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new HttpsError('invalid-argument', 'answers must be a non-empty array')
  }

  if (typeof timeSpentSeconds !== 'number' || timeSpentSeconds < 0) {
    throw new HttpsError('invalid-argument', 'timeSpentSeconds must be >= 0')
  }

  for (const answer of answers) {
    if (!VALID_OPTIONS.includes(answer.selected)) {
      throw new HttpsError('invalid-argument', `Invalid option: ${answer.selected}`)
    }
    if (!VALID_CONFIDENCES.includes(answer.confidence)) {
      throw new HttpsError('invalid-argument', `Invalid confidence: ${answer.confidence}`)
    }
    if (!Number.isInteger(answer.questionId) || answer.questionId <= 0) {
      throw new HttpsError('invalid-argument', 'Each answer must have a valid questionId (positive integer)')
    }
  }
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

  const missing = questionIds.filter((id) => !map.has(id))
  if (missing.length > 0) {
    throw new HttpsError('not-found', `Questions not found: ${missing.join(', ')}`)
  }

  return map
}

function buildAnswersOutput(answers: AnswerInput[], questionsMap: Map<number, Question>): AnswerOutput[] {
  return answers.map((answer) => {
    const question = questionsMap.get(answer.questionId)!
    const correct = answer.selected === question.resposta
    const questionOut: AnswerOutput['question'] = {
      enunciado: question.enunciado,
      alternativas: question.alternativas,
      resposta: question.resposta,
      ...(question.comentario !== undefined ? { comentario: question.comentario } : {}),
    }
    return {
      questionId: answer.questionId,
      selected: answer.selected,
      correct,
      confidence: answer.confidence,
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

    if (!breakdown[area]) breakdown[area] = { correct: 0, total: 0 }
    const entry = breakdown[area]!
    entry.total += 1
    if (answer.correct) entry.correct += 1
  }

  return breakdown as Record<Area, AreaBreakdown>
}

async function saveResult(
  uid: string,
  data: Omit<FinishSimuladoOutput, 'resultId'>,
): Promise<string> {
  const ref = await db.collection(`users/${uid}/results`).add({
    ...data,
    completedAt: FieldValue.serverTimestamp(),
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
    const cardRef = db.doc(`users/${uid}/srs_cards/${answer.questionId}`)
    const cardSnap = await cardRef.get()

    if (cardSnap.exists) {
      batch.update(cardRef, {
        lastConfidence: answer.confidence,
        dueDate: now,
        simuladoCorrect: correct,
      })
    } else {
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
  }

  await batch.commit()
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Re-export types used above for clarity
export type { Option, Confidence }
