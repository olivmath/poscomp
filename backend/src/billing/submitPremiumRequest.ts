import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth } from '../utils/auth'

export const submitPremiumRequest = onCall(async (request) => {
  const auth = requireAuth(request)
  const { transactionId, fileBase64, receiptType } = request.data as {
    transactionId: string
    fileBase64: string
    receiptType: string
  }

  console.log('submitPremiumRequest started', { uid: auth.uid, transactionId })

  if (!transactionId || typeof transactionId !== 'string') {
    throw new HttpsError('invalid-argument', 'transactionId is required')
  }
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    throw new HttpsError('invalid-argument', 'fileBase64 is required')
  }
  if (!receiptType || typeof receiptType !== 'string') {
    throw new HttpsError('invalid-argument', 'receiptType is required')
  }
  if (!receiptType.startsWith('image/') && receiptType !== 'application/pdf') {
    throw new HttpsError('invalid-argument', 'receiptType must be image/* or application/pdf')
  }

  const db = admin.firestore()
  const requestDoc = await db.doc(`premium_requests/${transactionId}`).get()
  if (!requestDoc.exists) {
    throw new HttpsError('not-found', 'Transaction not found')
  }

  const requestData = requestDoc.data()!
  if (requestData['uid'] !== auth.uid) {
    throw new HttpsError('permission-denied', 'Transaction does not belong to you')
  }
  if (requestData['status'] !== 'awaiting_receipt') {
    throw new HttpsError('failed-precondition', 'Transaction already submitted')
  }

  // Upload file to Storage via admin SDK
  const timestamp = Date.now()
  const ext = receiptType === 'application/pdf' ? 'pdf' : receiptType.split('/')[1] ?? 'jpg'
  const fileName = `${timestamp}.${ext}`
  const storagePath = `receipts/${auth.uid}/${transactionId}_${fileName}`

  const bucket = admin.storage().bucket()
  const file = bucket.file(storagePath)
  const buffer = Buffer.from(fileBase64, 'base64')

  try {
    await file.save(buffer, { contentType: receiptType })
  } catch (e) {
    const err = e as Error
    console.error('Storage upload failed', { bucket: bucket.name, storagePath, message: err?.message, stack: err?.stack })
    throw new HttpsError('internal', `Failed to upload file: ${err?.message ?? 'unknown'}`)
  }

  await db.doc(`premium_requests/${transactionId}`).update({
    status: 'pending',
    storagePath,
    receiptType,
    submittedAt: FieldValue.serverTimestamp(),
  })

  console.log('submitPremiumRequest finished', { uid: auth.uid, transactionId, storagePath })
  return { success: true }
})
