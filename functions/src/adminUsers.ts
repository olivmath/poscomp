import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { getAuth } from 'firebase-admin/auth'
import { db } from './index'

function requireAdmin(request: { auth?: { token?: Record<string, unknown> } }) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  if (request.auth.token?.admin !== true) throw new HttpsError('permission-denied', 'Admin required')
}

export const setAdminRole = onCall(async (request) => {
  logger.info('setAdminRole started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid')
  await getAuth().setCustomUserClaims(uid, { admin: true })
  return { success: true }
})

export const revokeAdminRole = onCall(async (request) => {
  logger.info('revokeAdminRole started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid')
  await getAuth().setCustomUserClaims(uid, { admin: false })
  return { success: true }
})

export const listUsers = onCall(async (request) => {
  logger.info('listUsers started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { pageToken } = (request.data ?? {}) as { pageToken?: string }
  const result = await getAuth().listUsers(100, pageToken)
  return {
    users: result.users.map((u) => ({
      uid: u.uid,
      email: u.email ?? null,
      displayName: u.displayName ?? null,
      photoURL: u.photoURL ?? null,
      disabled: u.disabled,
      isAdmin: u.customClaims?.admin === true,
      createdAt: u.metadata.creationTime,
      lastSignIn: u.metadata.lastSignInTime,
    })),
    pageToken: result.pageToken ?? null,
  }
})

export const disableUser = onCall(async (request) => {
  logger.info('disableUser started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid')
  await getAuth().updateUser(uid, { disabled: true })
  return { success: true }
})

export const enableUser = onCall(async (request) => {
  logger.info('enableUser started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid')
  await getAuth().updateUser(uid, { disabled: false })
  return { success: true }
})

export const resetUserSrs = onCall(async (request) => {
  logger.info('resetUserSrs started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid')
  const srsRef = db.collection(`users/${uid}/srs_cards`)
  const snapshot = await srsRef.get()
  const batch = db.batch()
  snapshot.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
  logger.info('resetUserSrs completed', { uid, deleted: snapshot.size })
  return { success: true, deleted: snapshot.size }
})

export const grantPremiumAdmin = onCall(async (request) => {
  const callerUid = request.auth?.uid
  logger.info('[grantPremiumAdmin] started', { callerUid })
  requireAdmin(request)

  const { uid, planType } = request.data as { uid?: unknown; planType?: unknown }

  if (!uid || typeof uid !== 'string') throw new HttpsError('invalid-argument', 'Missing uid')
  if (planType !== 'pro' && planType !== 'pro_max') throw new HttpsError('invalid-argument', 'planType must be pro or pro_max')

  const daysMs = planType === 'pro_max' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
  const premiumExpiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + daysMs))

  await db.collection('users').doc(uid).set({ isPremium: true, planType, premiumExpiresAt }, { merge: true })

  logger.info('[grantPremiumAdmin] premium granted', { callerUid, uid, planType, premiumExpiresAt })
  return { success: true }
})
