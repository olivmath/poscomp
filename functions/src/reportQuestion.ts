import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db } from './index'
import { FieldValue } from 'firebase-admin/firestore'

export const reportQuestion = onCall(async (request) => {
  logger.info('reportQuestion started', { uid: request.auth?.uid })
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

  const { questionId, comment } = request.data as { questionId: number; comment?: string }
  if (!questionId) throw new HttpsError('invalid-argument', 'Missing questionId')

  await db.collection('flagged_questions').add({
    uid: request.auth.uid,
    questionId,
    comment: comment ?? null,
    resolved: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  logger.info('reportQuestion completed', { uid: request.auth.uid, questionId })
  return { success: true }
})
