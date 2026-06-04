import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '../utils/auth'

export const setAdminRole = onCall(async (request) => {
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  console.log('setAdminRole started', { uid })
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
  await admin.auth().setCustomUserClaims(uid, { admin: true })
  console.log('setAdminRole finished', { uid })
  return { success: true }
})

export const revokeAdminRole = onCall(async (request) => {
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  console.log('revokeAdminRole started', { uid })
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
  await admin.auth().setCustomUserClaims(uid, { admin: false })
  console.log('revokeAdminRole finished', { uid })
  return { success: true }
})

export const listUsers = onCall(async (request) => {
  requireAdmin(request)
  const { pageToken } = request.data as { pageToken?: string }
  console.log('listUsers started', { pageToken })

  try {
    const result = await admin.auth().listUsers(100, pageToken || undefined)
    const uids = result.users.map((u) => u.uid)

    // Fetch additional data from Firestore in chunks of 100
    const db = admin.firestore()
    const userDataMap = new Map<string, FirebaseFirestore.DocumentData>()

    if (uids.length > 0) {
      const userDocs = await db.getAll(...uids.map((uid) => db.doc(`users/${uid}`)))
      userDocs.forEach((doc) => {
        if (doc.exists) {
          const data = doc.data()
          if (data) userDataMap.set(doc.id, data)
        }
      })
    }

    const users = result.users.map((u) => {
      const firestoreData = userDataMap.get(u.uid) || {}
      return {
        uid: u.uid,
        email: u.email ?? '',
        displayName: u.displayName ?? '',
        photoURL: u.photoURL ?? '',
        disabled: u.disabled,
        isAdmin: u.customClaims?.['admin'] === true,
        isPremium: firestoreData.isPremium === true,
        planType: firestoreData.planType || 'free',
        premiumExpiresAt: firestoreData.premiumExpiresAt || null,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime,
      }
    })

    console.log('listUsers finished', { count: users.length })
    return { users, nextPageToken: result.pageToken || null }
  } catch (error: unknown) {
    console.error('Error in listUsers:', error)
    if (error instanceof HttpsError) throw error
    const message = error instanceof Error ? error.message : 'Error listing users'
    throw new HttpsError('internal', message)
  }
})

export const disableUser = onCall(async (request) => {
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  console.log('disableUser started', { uid })
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
  await admin.auth().updateUser(uid, { disabled: true })
  console.log('disableUser finished', { uid })
  return { success: true }
})

export const enableUser = onCall(async (request) => {
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  console.log('enableUser started', { uid })
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
  await admin.auth().updateUser(uid, { disabled: false })
  console.log('enableUser finished', { uid })
  return { success: true }
})

export const resetUserSrs = onCall(async (request) => {
  requireAdmin(request)
  const { uid } = request.data as { uid: string }
  console.log('resetUserSrs started', { uid })
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')

  const db = admin.firestore()
  let deleted = 0
  let snap = await db.collection(`users/${uid}/srs_cards`).limit(400).get()
  while (!snap.empty) {
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
    if (snap.size < 400) break
    snap = await db.collection(`users/${uid}/srs_cards`).limit(400).get()
  }

  console.log('resetUserSrs finished', { uid, deleted })
  return { success: true, deleted }
})

export const grantPremiumAdmin = onCall(async (request) => {
  requireAdmin(request)
  const { uid, planType } = request.data as { uid: string; planType: 'pro' | 'pro_max' }
  console.log('grantPremiumAdmin started', { uid, planType })

  if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
  if (planType !== 'pro' && planType !== 'pro_max') {
    throw new HttpsError('invalid-argument', 'planType must be pro or pro_max')
  }

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + (planType === 'pro_max' ? 365 : 30))

  await admin.firestore().doc(`users/${uid}`).set(
    {
      isPremium: true,
      planType,
      premiumStatus: 'active',
      premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      lastActivity: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log('grantPremiumAdmin finished', { uid, planType })
  return { success: true }
})
