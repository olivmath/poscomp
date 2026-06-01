import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { db } from './index'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

function requireAdmin(request: { auth?: { token?: Record<string, unknown> } }) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')
  if (request.auth.token?.admin !== true) throw new HttpsError('permission-denied', 'Admin required')
}

interface AnnouncementInput {
  message: string
  active: boolean
  type: 'info' | 'warning' | 'success'
  expiresAt?: string | null  // ISO string ou null
  url?: string | null
}

async function deactivateOthers(excludeId?: string) {
  const snap = await db.collection('announcements').where('active', '==', true).get()
  const batch = db.batch()
  snap.docs.forEach((d) => {
    if (d.id !== excludeId) batch.update(d.ref, { active: false })
  })
  await batch.commit()
}

export const createAnnouncement = onCall(async (request) => {
  logger.info('createAnnouncement started', { uid: request.auth?.uid })
  requireAdmin(request)
  const data = request.data as AnnouncementInput
  if (!data.message || !data.type) {
    throw new HttpsError('invalid-argument', 'Missing required fields: message, type')
  }
  const active = data.active ?? true
  if (active) await deactivateOthers()
  const doc = {
    message: data.message,
    active,
    type: data.type,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt)) : null,
    url: data.url ?? null,
  }
  const ref = await db.collection('announcements').add(doc)
  logger.info('createAnnouncement completed', { id: ref.id })
  return { id: ref.id }
})

export const updateAnnouncement = onCall(async (request) => {
  logger.info('updateAnnouncement started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { id, ...data } = request.data as { id: string } & Partial<AnnouncementInput>
  if (!id) throw new HttpsError('invalid-argument', 'Missing id')
  const ref = db.collection('announcements').doc(id)
  const doc = await ref.get()
  if (!doc.exists) throw new HttpsError('not-found', `Announcement ${id} not found`)
  const update: Record<string, unknown> = {}
  if (data.message !== undefined) update.message = data.message
  if (data.active !== undefined) update.active = data.active
  if (data.type !== undefined) update.type = data.type
  if (data.url !== undefined) update.url = data.url
  if (data.expiresAt !== undefined) {
    update.expiresAt = data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt)) : null
  }
  if (data.active === true) await deactivateOthers(id)
  await ref.update(update)
  logger.info('updateAnnouncement completed', { id })
  return { success: true }
})

export const deleteAnnouncement = onCall(async (request) => {
  logger.info('deleteAnnouncement started', { uid: request.auth?.uid })
  requireAdmin(request)
  const { id } = request.data as { id: string }
  if (!id) throw new HttpsError('invalid-argument', 'Missing id')
  const ref = db.collection('announcements').doc(id)
  const doc = await ref.get()
  if (!doc.exists) throw new HttpsError('not-found', `Announcement ${id} not found`)
  await ref.delete()
  logger.info('deleteAnnouncement completed', { id })
  return { success: true }
})
