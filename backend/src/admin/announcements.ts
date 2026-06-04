import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '../utils/auth'

export const createAnnouncement = onCall(async (request) => {
  requireAdmin(request)
  const { message, type, active, url, expiresAt } = request.data as {
    message: string
    type: 'info' | 'warning' | 'success'
    active: boolean
    url?: string | null
    expiresAt?: string | null
  }

  console.log('createAnnouncement started')

  if (!message || typeof message !== 'string') {
    throw new HttpsError('invalid-argument', 'message is required')
  }
  if (!['info', 'warning', 'success'].includes(type)) {
    throw new HttpsError('invalid-argument', 'type must be info, warning, or success')
  }

  const db = admin.firestore()
  const docRef = await db.collection('announcements').add({
    message,
    type,
    active: active ?? true,
    url: url ?? '',
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
  })

  console.log('createAnnouncement finished', { id: docRef.id })
  return { id: docRef.id }
})

export const updateAnnouncement = onCall(async (request) => {
  requireAdmin(request)
  const { id, ...fields } = request.data as { id: string } & Record<string, unknown>
  console.log('updateAnnouncement started', { id })

  if (!id || typeof id !== 'string') {
    throw new HttpsError('invalid-argument', 'id is required')
  }

  const db = admin.firestore()
  const doc = await db.doc(`announcements/${id}`).get()
  if (!doc.exists) {
    throw new HttpsError('not-found', 'Announcement not found')
  }

  const updates: Record<string, unknown> = { ...fields, updatedAt: FieldValue.serverTimestamp() }
  if (typeof updates['expiresAt'] === 'string') {
    updates['expiresAt'] = admin.firestore.Timestamp.fromDate(new Date(updates['expiresAt'] as string))
  }

  await db.doc(`announcements/${id}`).update(updates)

  console.log('updateAnnouncement finished', { id })
  return { success: true }
})

export const deleteAnnouncement = onCall(async (request) => {
  requireAdmin(request)
  const { id } = request.data as { id: string }
  console.log('deleteAnnouncement started', { id })

  if (!id || typeof id !== 'string') {
    throw new HttpsError('invalid-argument', 'id is required')
  }

  const db = admin.firestore()
  await db.doc(`announcements/${id}`).delete()

  console.log('deleteAnnouncement finished', { id })
  return { success: true }
})
