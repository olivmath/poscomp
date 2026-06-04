import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requireAuth } from '../utils/auth'

export const getPendingCount = onCall(async (request) => {
  const auth = requireAuth(request)
  console.log('getPendingCount started', { uid: auth.uid })

  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  let snap: FirebaseFirestore.QuerySnapshot
  try {
    snap = await db
      .collection(`users/${auth.uid}/srs_cards`)
      .where('dueDate', '<=', now)
      .where('lastConfidence', 'in', ['should_know', 'studying'])
      .get()
  } catch (e) {
    throw new HttpsError('internal', 'Firestore error')
  }

  console.log('getPendingCount finished', { uid: auth.uid, count: snap.size })
  return { count: snap.size }
})
