import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requireAuth } from '../utils/auth'

async function deleteCollection(db: FirebaseFirestore.Firestore, path: string): Promise<number> {
  let deleted = 0
  const query = db.collection(path).limit(400)
  let snap = await query.get()
  while (!snap.empty) {
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
    if (snap.size < 400) break
    snap = await query.get()
  }
  return deleted
}

export const deleteAllData = onCall(async (request) => {
  const auth = requireAuth(request)
  console.log('deleteAllData started', { uid: auth.uid })

  const db = admin.firestore()
  let totalDeleted = 0
  try {
    const [srsDeleted, resultsDeleted] = await Promise.all([
      deleteCollection(db, `users/${auth.uid}/srs_cards`),
      deleteCollection(db, `users/${auth.uid}/results`),
    ])
    totalDeleted = srsDeleted + resultsDeleted
  } catch (e) {
    throw new HttpsError('internal', 'Failed to delete data')
  }

  console.log('deleteAllData finished', { uid: auth.uid, deleted: totalDeleted })
  return { deleted: true }
})
