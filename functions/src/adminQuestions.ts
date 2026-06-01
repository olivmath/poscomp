import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db } from './index'
import type { Question } from './types'

function requireAdmin(request: { auth?: { token?: Record<string, unknown> } }) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  if (request.auth.token?.admin !== true) throw new HttpsError('permission-denied', 'Admin required')
}

export const createQuestion = onCall(async (request) => {
  logger.info('createQuestion started', { uid: request.auth?.uid })
  requireAdmin(request)

  const data = request.data as Omit<Question, 'id'>

  if (!data.ano || !data.area || !data.enunciado || !data.alternativas || !data.resposta) {
    throw new HttpsError('invalid-argument', 'Missing required fields: ano, area, enunciado, alternativas, resposta')
  }

  // id = próximo disponível (max + 1)
  const snapshot = await db.collection('questions').orderBy('id', 'desc').limit(1).get()
  const nextId = snapshot.empty ? 1 : ((snapshot.docs[0]?.data().id as number) ?? 0) + 1

  const question: Question = { ...data, id: nextId }
  await db.collection('questions').doc(String(nextId)).set(question)

  logger.info('createQuestion completed', { id: nextId })
  return { id: nextId }
})

export const updateQuestion = onCall(async (request) => {
  logger.info('updateQuestion started', { uid: request.auth?.uid })
  requireAdmin(request)

  const { id, ...data } = request.data as { id: number } & Partial<Question>

  if (!id) throw new HttpsError('invalid-argument', 'Missing id')

  const ref = db.collection('questions').doc(String(id))
  const doc = await ref.get()
  if (!doc.exists) throw new HttpsError('not-found', `Question ${id} not found`)

  await ref.update(data)

  logger.info('updateQuestion completed', { id })
  return { success: true }
})

export const deleteQuestion = onCall(async (request) => {
  logger.info('deleteQuestion started', { uid: request.auth?.uid })
  requireAdmin(request)

  const { id } = request.data as { id: number }

  if (!id) throw new HttpsError('invalid-argument', 'Missing id')

  const ref = db.collection('questions').doc(String(id))
  const doc = await ref.get()
  if (!doc.exists) throw new HttpsError('not-found', `Question ${id} not found`)

  await ref.delete()

  logger.info('deleteQuestion completed', { id })
  return { success: true }
})
