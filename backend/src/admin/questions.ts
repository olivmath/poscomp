import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '../utils/auth'
import { Question, VALID_OPTIONS, VALID_MATERIAS, Option, Materia } from '../types'

export const listQuestions = onCall(async (request) => {
  requireAdmin(request)
  console.log('listQuestions started')

  const db = admin.firestore()
  const snap = await db.collection('questions').orderBy('id', 'asc').get()
  const questions = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((q) => !(q as Record<string, unknown>)['deleted'])

  console.log('listQuestions finished', { count: questions.length })
  return { questions }
})

export const createQuestion = onCall(async (request) => {
  requireAdmin(request)
  const data = request.data as Omit<Question, 'id'>
  console.log('createQuestion started')

  if (!data.ano || !data.materia || !data.enunciado || !data.alternativas || !data.resposta) {
    throw new HttpsError('invalid-argument', 'Missing required question fields')
  }
  if (!VALID_MATERIAS.includes(data.materia as Materia)) {
    throw new HttpsError('invalid-argument', 'Invalid materia')
  }
  if (!VALID_OPTIONS.includes(data.resposta as Option)) {
    throw new HttpsError('invalid-argument', 'Invalid resposta')
  }

  const db = admin.firestore()
  const snap = await db.collection('questions').orderBy('id', 'desc').limit(1).get()
  const nextId = snap.empty ? 1 : (snap.docs[0].data()['id'] as number) + 1

  await db.doc(`questions/${nextId}`).set({
    ...data,
    id: nextId,
    createdAt: FieldValue.serverTimestamp(),
  })

  console.log('createQuestion finished', { id: nextId })
  return { id: nextId }
})

export const updateQuestion = onCall(async (request) => {
  requireAdmin(request)
  const { id, ...fields } = request.data as { id: number } & Partial<Question>
  console.log('updateQuestion started', { id })

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpsError('invalid-argument', 'id must be a positive integer')
  }

  const db = admin.firestore()
  const doc = await db.doc(`questions/${id}`).get()
  if (!doc.exists) {
    throw new HttpsError('not-found', `Question ${id} not found`)
  }

  await db.doc(`questions/${id}`).update({ ...fields, updatedAt: FieldValue.serverTimestamp() })

  console.log('updateQuestion finished', { id })
  return { success: true }
})

export const deleteQuestion = onCall(async (request) => {
  requireAdmin(request)
  const { id } = request.data as { id: number }
  console.log('deleteQuestion started', { id })

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpsError('invalid-argument', 'id must be a positive integer')
  }

  const db = admin.firestore()
  await db.doc(`questions/${id}`).update({
    deleted: true,
    deletedAt: FieldValue.serverTimestamp(),
  })

  console.log('deleteQuestion finished', { id })
  return { success: true }
})
