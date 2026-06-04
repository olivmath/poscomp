import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { requirePremium } from '../utils/auth'

export const getResult = onCall(async (request) => {
  const auth = await requirePremium(request)
  const { resultId } = request.data as { resultId: string }

  console.log('getResult started', { uid: auth.uid, resultId })

  if (!resultId || typeof resultId !== 'string') {
    throw new HttpsError('invalid-argument', 'resultId is required')
  }

  const db = admin.firestore()
  let doc: FirebaseFirestore.DocumentSnapshot
  try {
    doc = await db.doc(`users/${auth.uid}/results/${resultId}`).get()
  } catch (e) {
    throw new HttpsError('internal', 'Firestore error')
  }

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Result not found')
  }

  const data = doc.data()!
  console.log('getResult finished', { uid: auth.uid, resultId })
  return {
    resultId: doc.id,
    score: data['score'],
    totalQuestions: data['totalQuestions'],
    timeSpentSeconds: data['timeSpentSeconds'],
    completedAt: data['completedAt']?.toDate().toISOString() ?? new Date().toISOString(),
    materiaBreakdown: data['materiaBreakdown'],
    answers: data['answers'],
  }
})
