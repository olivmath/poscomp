import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db } from './index'
import { FieldValue } from 'firebase-admin/firestore'

export const getFlaggedQuestions = onCall(async (request) => {
  logger.info('getFlaggedQuestions started', { uid: request.auth?.uid })
  
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

  const snapshot = await db.collection('flagged_questions').where('resolved', '==', false).get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
})

export const resolveFlaggedQuestion = onCall(async (request) => {
  logger.info('resolveFlaggedQuestion started', { uid: request.auth?.uid })

  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  const { id } = request.data
  if (!id) throw new HttpsError('invalid-argument', 'Missing id')

  await db.doc(`flagged_questions/${id}`).update({ resolved: true, resolvedAt: FieldValue.serverTimestamp() })
  return { success: true }
})
