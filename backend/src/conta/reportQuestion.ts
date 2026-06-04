import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth } from '../utils/auth'

export const reportQuestion = onCall(async (request) => {
  const auth = requireAuth(request)
  const { questionId, comment } = request.data as { questionId: number; comment?: string }

  console.log('reportQuestion started', { uid: auth.uid, questionId })

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw new HttpsError('invalid-argument', 'questionId must be a positive integer')
  }

  const db = admin.firestore()
  try {
    await db.collection('flagged_questions').add({
      uid: auth.uid,
      questionId,
      comment: comment ?? '',
      resolved: false,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (e) {
    throw new HttpsError('internal', 'Failed to report question')
  }

  console.log('reportQuestion finished', { uid: auth.uid, questionId })
  return { success: true }
})
