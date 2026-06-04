import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth } from '../utils/auth'
import { VALID_OPTIONS, VALID_CONFIDENCES, Option, Confidence, Materia, Question } from '../types'
import { chunkArray } from '../utils/chunks'

interface AnswerInput {
  questionId: number
  selected: Option
  confidence: Confidence
}

interface FinishSimuladoInput {
  simuladoId: string
  answers: AnswerInput[]
  timeSpentSeconds: number
}

export const finishSimulado = onCall(async (request) => {
  const auth = requireAuth(request)
  const { simuladoId, answers, timeSpentSeconds } = request.data as FinishSimuladoInput

  console.log('finishSimulado started', { uid: auth.uid, simuladoId, answerCount: answers?.length })

  // Idempotency: check if result already exists
  if (!simuladoId || typeof simuladoId !== 'string') {
    throw new HttpsError('invalid-argument', 'simuladoId is required')
  }

  const db = admin.firestore()
  const existingResult = await db.doc(`users/${auth.uid}/results/${simuladoId}`).get()
  if (existingResult.exists) {
    const data = existingResult.data()!
    console.log('finishSimulado finished (idempotent)', { uid: auth.uid, simuladoId })
    return {
      resultId: simuladoId,
      score: data['score'],
      totalQuestions: data['totalQuestions'],
      timeSpentSeconds: data['timeSpentSeconds'],
      materiaBreakdown: data['materiaBreakdown'],
      answers: data['answers'],
    }
  }

  // Validations
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new HttpsError('invalid-argument', 'answers cannot be empty')
  }
  if (typeof timeSpentSeconds !== 'number' || timeSpentSeconds < 0) {
    throw new HttpsError('invalid-argument', 'timeSpentSeconds must be >= 0')
  }
  for (const a of answers) {
    if (!Number.isInteger(a.questionId) || a.questionId <= 0) {
      throw new HttpsError('invalid-argument', `Invalid questionId: ${a.questionId}`)
    }
    if (!VALID_OPTIONS.includes(a.selected)) {
      throw new HttpsError('invalid-argument', `Invalid selected option: ${a.selected}`)
    }
    if (!VALID_CONFIDENCES.includes(a.confidence)) {
      throw new HttpsError('invalid-argument', `Invalid confidence: ${a.confidence}`)
    }
  }

  // Fetch questions in chunks of 30
  const questionIds = answers.map((a) => a.questionId)
  const chunks = chunkArray(questionIds, 30)
  const questionMap = new Map<number, Question>()

  for (const chunk of chunks) {
    const chunkStrings = chunk.map((id) => String(id))
    const snap = await db.collection('questions').where('id', 'in', chunk).get()
    // Also try doc IDs as strings
    if (snap.empty) {
      const docRefs = chunkStrings.map((id) => db.doc(`questions/${id}`))
      const docSnaps = await db.getAll(...docRefs)
      for (const d of docSnaps) {
        if (d.exists) {
          const q = d.data() as Question
          questionMap.set(q.id, q)
        }
      }
    } else {
      for (const d of snap.docs) {
        const q = d.data() as Question
        questionMap.set(q.id, q)
      }
    }
  }

  // Also fetch by doc ID directly (questions stored as "1","2",...)
  const missingIds = questionIds.filter((id) => !questionMap.has(id))
  if (missingIds.length > 0) {
    const missingChunks = chunkArray(missingIds, 30)
    for (const chunk of missingChunks) {
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

  // Validate all question IDs exist
  for (const id of questionIds) {
    if (!questionMap.has(id)) {
      throw new HttpsError('not-found', `Question ${id} not found`)
    }
  }

  // Build result
  const materiaBreakdown: Record<string, { correct: number; total: number }> = {}
  let score = 0
  const answersOutput = answers.map((a) => {
    const q = questionMap.get(a.questionId)!
    const correct = q.resposta === a.selected
    if (correct) score++
    const m = q.materia
    if (!materiaBreakdown[m]) materiaBreakdown[m] = { correct: 0, total: 0 }
    materiaBreakdown[m].total++
    if (correct) materiaBreakdown[m].correct++
    return {
      questionId: a.questionId,
      selected: a.selected,
      correct,
      confidence: a.confidence,
      question: {
        id: q.id,
        materia: q.materia,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        resposta: q.resposta,
        comentario: q.comentario,
      },
    }
  })

  const today = new Date().toISOString().split('T')[0]
  const resultData = {
    score,
    totalQuestions: answers.length,
    timeSpentSeconds,
    completedAt: FieldValue.serverTimestamp(),
    materiaBreakdown,
    answers: answersOutput,
  }

  // Parallel writes
  const resultRef = db.doc(`users/${auth.uid}/results/${simuladoId}`)
  const userRef = db.doc(`users/${auth.uid}`)

  const batch = db.batch()
  batch.set(resultRef, resultData)
  batch.set(
    userRef,
    {
      lastActivity: FieldValue.serverTimestamp(),
      activeDays: FieldValue.arrayUnion(today),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  // SRS cards batch
  const now = admin.firestore.Timestamp.now()
  const srsCardsBatch = db.batch()
  for (const a of answers) {
    const cardRef = db.doc(`users/${auth.uid}/srs_cards/${a.questionId}`)
    const cardSnap = await cardRef.get()
    const q = questionMap.get(a.questionId)!

    if (!cardSnap.exists) {
      // Create new card
      srsCardsBatch.set(cardRef, {
        questionId: a.questionId,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        dueDate: now,
        createdAt: now,
        lastConfidence: a.confidence,
        studied: false,
        simuladoCorrect: q.resposta === a.selected,
        materia: q.materia as Materia,
      })
    } else {
      const cardData = cardSnap.data()!
      if (!cardData['studied']) {
        // Not yet reviewed — update dueDate
        srsCardsBatch.update(cardRef, {
          lastConfidence: a.confidence,
          dueDate: now,
          simuladoCorrect: q.resposta === a.selected,
          materia: q.materia,
        })
      } else {
        // Already reviewed — preserve SM-2 dueDate
        srsCardsBatch.update(cardRef, {
          lastConfidence: a.confidence,
          simuladoCorrect: q.resposta === a.selected,
          materia: q.materia,
        })
      }
    }
  }

  await Promise.all([batch.commit(), srsCardsBatch.commit()])

  console.log('finishSimulado finished', { uid: auth.uid, simuladoId, score })
  return {
    resultId: simuladoId,
    score,
    totalQuestions: answers.length,
    timeSpentSeconds,
    materiaBreakdown,
    answers: answersOutput,
  }
})
