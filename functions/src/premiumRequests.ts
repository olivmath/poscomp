import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from './index'
import { notifyPremiumApproved } from './notifications'

function requireAdmin(request: { auth?: { uid?: string; token?: Record<string, unknown> } }) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  if (request.auth.token?.admin !== true) throw new HttpsError('permission-denied', 'Admin required')
}

export const submitPremiumRequest = onCall(async (request) => {
  logger.info('[submitPremiumRequest] iniciado', { callerUid: request.auth?.uid })

  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

  const uid = request.auth.uid
  const { storagePath, receiptType, planType } = request.data as { storagePath?: unknown; receiptType?: unknown; planType?: unknown }

  if (typeof storagePath !== 'string') {
    throw new HttpsError('invalid-argument', 'storagePath is required')
  }

  if (planType !== 'pro' && planType !== 'pro_max') {
    throw new HttpsError('invalid-argument', 'planType must be pro or pro_max')
  }

  // garante que o path pertence ao uid autenticado — impede acesso a arquivos de outros usuários
  const expectedPrefix = `receipts/${uid}/`
  if (!storagePath.startsWith(expectedPrefix)) {
    logger.warn('[submitPremiumRequest] storagePath não pertence ao uid', { uid, storagePath })
    throw new HttpsError('permission-denied', 'storagePath does not belong to the authenticated user')
  }

  const bucket = admin.storage().bucket()
  const receiptUrl = await bucket.file(storagePath).getSignedUrl({
    action: 'read',
    expires: '2099-01-01',
  }).then(([url]) => url)

  const docRef = await db.collection('premium_requests').add({
    uid,
    status: 'pending',
    receiptUrl,
    receiptType: typeof receiptType === 'string' ? receiptType : null,
    planType,
    createdAt: FieldValue.serverTimestamp(),
  })

  logger.info('[submitPremiumRequest] ticket criado', { uid, requestId: docRef.id, planType })
  return { requestId: docRef.id }
})

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

  const data = snap.data() as { uid: string; status: string; planType?: 'pro' | 'pro_max' }
  logger.info('[reviewPremiumRequest] documento encontrado', { requestId, uid: data.uid, status: data.status })

  if (data.status !== 'pending') {
    logger.warn('[reviewPremiumRequest] ticket já processado', { requestId, status: data.status })
    throw new HttpsError('failed-precondition', `Request already ${data.status}`)
  }

  const reviewedAt = FieldValue.serverTimestamp()
  const reviewedBy = request.auth!.uid!

  if (action === 'approve') {
    const planType = data.planType ?? 'pro'
    const daysMs = planType === 'pro_max' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    const premiumExpiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + daysMs))
    logger.info('[reviewPremiumRequest] aprovando — setando isPremium=true', { uid: data.uid, planType, premiumExpiresAt })
    await db.collection('users').doc(data.uid).set({ isPremium: true, planType, premiumExpiresAt }, { merge: true })
    await reqRef.update({ status: 'approved', reviewedAt, reviewedBy })
    logger.info('[reviewPremiumRequest] aprovado com sucesso', { requestId, uid: data.uid, reviewedBy, planType, premiumExpiresAt })
    notifyPremiumApproved(data.uid).catch((e) =>
      logger.warn('[reviewPremiumRequest] push failed (non-critical)', { uid: data.uid, error: e?.message }),
    )
  } else {
    logger.info('[reviewPremiumRequest] negando ticket', { requestId, uid: data.uid })
    await reqRef.update({ status: 'denied', reviewedAt, reviewedBy })
    logger.info('[reviewPremiumRequest] negado com sucesso', { requestId, uid: data.uid, reviewedBy })
  }

  return { success: true }
})
