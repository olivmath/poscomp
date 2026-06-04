import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth } from '../utils/auth'
import * as QRCode from 'qrcode'

export const getPixConfig = onCall(async (request) => {
  const auth = requireAuth(request)
  const { planType } = request.data as { planType: 'pro' | 'pro_max' }

  console.log('getPixConfig started', { uid: auth.uid, planType })

  if (planType !== 'pro' && planType !== 'pro_max') {
    throw new HttpsError('invalid-argument', 'planType must be pro or pro_max')
  }

  const pixKey = process.env.PIX_KEY
  if (!pixKey) {
    throw new HttpsError('internal', 'PIX_KEY not configured')
  }

  const transactionId = admin.firestore().collection('premium_requests').doc().id

  const pixCopyPaste = `PIX:${pixKey}:${transactionId}`

  let pixQrBase64: string
  try {
    pixQrBase64 = await QRCode.toDataURL(pixCopyPaste, { width: 200 })
  } catch (e) {
    throw new HttpsError('internal', 'Failed to generate QR code')
  }

  try {
    await admin.firestore().doc(`premium_requests/${transactionId}`).set({
      uid: auth.uid,
      status: 'awaiting_receipt',
      planType,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (e) {
    throw new HttpsError('internal', 'Failed to create premium request')
  }

  console.log('getPixConfig finished', { uid: auth.uid, transactionId })
  return { transactionId, pixQrBase64, pixCopyPaste }
})
