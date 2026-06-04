import { HttpsError, CallableRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

export function requireAuth(request: CallableRequest) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required')
  return request.auth
}

export function requireAdmin(request: CallableRequest) {
  const auth = requireAuth(request)
  if (!auth.token['admin']) throw new HttpsError('permission-denied', 'Admin required')
  return auth
}

export async function requirePremium(request: CallableRequest) {
  const auth = requireAuth(request)
  const userDoc = await admin.firestore().doc(`users/${auth.uid}`).get()
  const user = userDoc.data()
  if (!user?.isPremium) throw new HttpsError('permission-denied', 'Premium required')
  const expires = user.premiumExpiresAt?.toDate()
  if (expires && expires < new Date()) {
    await admin.firestore().doc(`users/${auth.uid}`).update({ isPremium: false })
    throw new HttpsError('permission-denied', 'Premium expired')
  }
  return auth
}
