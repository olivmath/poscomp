import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db } from './index'

function requireAdmin(request: { auth?: { token?: Record<string, unknown> } }) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  if (request.auth.token?.admin !== true) throw new HttpsError('permission-denied', 'Admin required')
}

export const deleteFlaggedQuestion = onCall(async (request) => {
  logger.info('deleteFlaggedQuestion started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { id } = request.data as { id: string }
  if (!id) throw new HttpsError('invalid-argument', 'Missing id')
  await db.collection('flagged_questions').doc(id).delete()
  logger.info('deleteFlaggedQuestion completed', { id })
  return { success: true }
})
