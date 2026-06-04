import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '../utils/auth'

export const getFlaggedQuestions = onCall(async (request) => {
  requireAdmin(request)
  const { limit: queryLimit, startAfter } = request.data as { limit?: number; startAfter?: string }
  console.log('getFlaggedQuestions started')

  const db = admin.firestore()
  const pageSize = queryLimit && queryLimit > 0 ? queryLimit : 50

  let query: FirebaseFirestore.Query = db
    .collection('flagged_questions')
    .where('resolved', '==', false)
    .orderBy('createdAt', 'desc')
    .limit(pageSize)

  if (startAfter) {
    const cursorDoc = await db.doc(`flagged_questions/${startAfter}`).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const snap = await query.get()
  const flags = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data()['createdAt']?.toDate().toISOString(),
  }))

  console.log('getFlaggedQuestions finished', { count: flags.length })
  return { flags }
})

export const resolveFlaggedQuestion = onCall(async (request) => {
  requireAdmin(request)
  const { id } = request.data as { id: string }
  console.log('resolveFlaggedQuestion started', { id })

  if (!id || typeof id !== 'string') {
    throw new HttpsError('invalid-argument', 'id is required')
  }

  const db = admin.firestore()
  const doc = await db.doc(`flagged_questions/${id}`).get()
  if (!doc.exists) {
    throw new HttpsError('not-found', 'Flagged question not found')
  }

  await db.doc(`flagged_questions/${id}`).update({
    resolved: true,
    resolvedAt: FieldValue.serverTimestamp(),
  })

  console.log('resolveFlaggedQuestion finished', { id })
  return { success: true }
})

export const deleteFlaggedQuestion = onCall(async (request) => {
  requireAdmin(request)
  const { id } = request.data as { id: string }
  console.log('deleteFlaggedQuestion started', { id })

  if (!id || typeof id !== 'string') {
    throw new HttpsError('invalid-argument', 'id is required')
  }

  const db = admin.firestore()
  await db.doc(`flagged_questions/${id}`).delete()

  console.log('deleteFlaggedQuestion finished', { id })
  return { success: true }
})
