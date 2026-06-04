import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '../utils/auth'
import { sendPush } from '../background/notifications'

export const listPremiumRequests = onCall(async (request) => {
  requireAdmin(request)
  console.log('listPremiumRequests started')

  const db = admin.firestore()
  const snap = await db.collection('premium_requests').orderBy('createdAt', 'desc').get()
  const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  console.log('listPremiumRequests finished', { count: requests.length })
  return { requests }
})

export const reviewPremiumRequest = onCall(async (request) => {
  const auth = requireAdmin(request)
  const { requestId, action } = request.data as { requestId: string; action: 'approve' | 'deny' }

  console.log('reviewPremiumRequest started', { uid: auth.uid, requestId, action })

  if (!requestId || typeof requestId !== 'string') {
    throw new HttpsError('invalid-argument', 'requestId is required')
  }
  if (action !== 'approve' && action !== 'deny') {
    throw new HttpsError('invalid-argument', 'action must be approve or deny')
  }

  const db = admin.firestore()
  const reqDoc = await db.doc(`premium_requests/${requestId}`).get()
  if (!reqDoc.exists) {
    throw new HttpsError('not-found', 'Request not found')
  }

  const reqData = reqDoc.data()!
  if (reqData['status'] !== 'pending') {
    throw new HttpsError('failed-precondition', 'Request is not in pending state')
  }

  const targetUid: string = reqData['uid']
  const planType: 'pro' | 'pro_max' = reqData['planType']

  if (action === 'approve') {
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + (planType === 'pro_max' ? 365 : 30))

    const batch = db.batch()
    batch.update(db.doc(`premium_requests/${requestId}`), {
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: auth.uid,
    })
    batch.set(
      db.doc(`users/${targetUid}`),
      {
        isPremium: true,
        planType,
        premiumStatus: 'active',
        premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      },
      { merge: true }
    )
    await batch.commit()

    // Fire-and-forget notification
    sendPush(targetUid, {
      title: 'Premium ativado!',
      body: 'Sua assinatura foi aprovada. Aproveite o acesso completo ao POSCOMP App.',
      url: '/perfil',
    }).catch((e) => console.warn('Failed to send premium approved notification', e))
  } else {
    await db.doc(`premium_requests/${requestId}`).update({
      status: 'denied',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: auth.uid,
    })
  }

  console.log('reviewPremiumRequest finished', { uid: auth.uid, requestId, action })
  return { success: true }
})
