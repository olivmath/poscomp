import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth } from '../utils/auth'

export const registerFcmToken = onCall(async (request) => {
  const auth = requireAuth(request)
  const { token } = request.data as { token: string }

  console.log('registerFcmToken started', { uid: auth.uid })

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'token is required and must be a non-empty string')
  }
  // Basic FCM token format validation: alphanumeric + : - _ .
  if (!/^[A-Za-z0-9:_\-./]+$/.test(token)) {
    throw new HttpsError('invalid-argument', 'Invalid FCM token format')
  }

  const db = admin.firestore()
  await db.doc(`users/${auth.uid}`).set(
    {
      fcmTokens: FieldValue.arrayUnion(token),
    },
    { merge: true }
  )

  console.log('registerFcmToken finished', { uid: auth.uid })
  return { success: true }
})
