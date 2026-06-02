import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from './index'

function requireAdmin(request: { auth?: { uid?: string; token?: Record<string, unknown> } }) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  if (request.auth.token?.admin !== true) throw new HttpsError('permission-denied', 'Admin required')
}

export const onPremiumRequestCreated = onDocumentCreated('premium_requests/{requestId}', (event) => {
  const data = event.data?.data()
  logger.info('[premiumRequests] novo ticket criado', {
    requestId: event.params.requestId,
    uid: data?.uid,
    status: data?.status,
    receiptUrl: data?.receiptUrl,
    createdAt: data?.createdAt,
  })
})

export const reviewPremiumRequest = onCall(async (request) => {
  logger.info('[reviewPremiumRequest] iniciado', { callerUid: request.auth?.uid })
  requireAdmin(request)

  const { requestId, action } = request.data as { requestId: string; action: 'approve' | 'deny' }
  logger.info('[reviewPremiumRequest] params recebidos', { requestId, action })

  if (!requestId) throw new HttpsError('invalid-argument', 'Missing requestId')
  if (action !== 'approve' && action !== 'deny') throw new HttpsError('invalid-argument', 'action must be approve or deny')

  logger.info('[reviewPremiumRequest] buscando documento', { requestId })
  const reqRef = db.collection('premium_requests').doc(requestId)
  const snap = await reqRef.get()
  if (!snap.exists) {
    logger.error('[reviewPremiumRequest] documento não encontrado', { requestId })
    throw new HttpsError('not-found', `premium_request not found: ${requestId}`)
  }

  const data = snap.data() as { uid: string; status: string }
  logger.info('[reviewPremiumRequest] documento encontrado', { requestId, uid: data.uid, status: data.status })

  if (data.status !== 'pending') {
    logger.warn('[reviewPremiumRequest] ticket já processado', { requestId, status: data.status })
    throw new HttpsError('failed-precondition', `Request already ${data.status}`)
  }

  const reviewedAt = FieldValue.serverTimestamp()
  const reviewedBy = request.auth!.uid!

  if (action === 'approve') {
    logger.info('[reviewPremiumRequest] aprovando — setando isPremium=true', { uid: data.uid })
    await db.collection('users').doc(data.uid).set({ isPremium: true }, { merge: true })
    await reqRef.update({ status: 'approved', reviewedAt, reviewedBy })
    logger.info('[reviewPremiumRequest] aprovado com sucesso', { requestId, uid: data.uid, reviewedBy })
  } else {
    logger.info('[reviewPremiumRequest] negando ticket', { requestId, uid: data.uid })
    await reqRef.update({ status: 'denied', reviewedAt, reviewedBy })
    logger.info('[reviewPremiumRequest] negado com sucesso', { requestId, uid: data.uid, reviewedBy })
  }

  return { success: true }
})
