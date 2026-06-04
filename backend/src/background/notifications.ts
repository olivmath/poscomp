import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

export async function sendPush(
  uid: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  const userDoc = await admin.firestore().doc(`users/${uid}`).get()
  if (!userDoc.exists) return
  const tokens: string[] = userDoc.data()?.['fcmTokens'] ?? []
  if (tokens.length === 0) return

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: payload.url
      ? { fcmOptions: { link: payload.url } }
      : undefined,
  }

  const response = await admin.messaging().sendEachForMulticast(message)
  const invalidTokens: string[] = []
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
      invalidTokens.push(tokens[i])
    }
  })

  if (invalidTokens.length > 0) {
    const { FieldValue } = await import('firebase-admin/firestore')
    await admin.firestore().doc(`users/${uid}`).update({
      fcmTokens: FieldValue.arrayRemove(...invalidTokens),
    })
  }
}

export const sendReviewReminder = onSchedule('0 12 * * *', async () => {
  console.log('sendReviewReminder started')
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  const usersSnap = await db
    .collection('users')
    .where('notificationsEnabled', '==', true)
    .get()

  let sent = 0
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id
    const cardsSnap = await db
      .collection(`users/${uid}/srs_cards`)
      .where('dueDate', '<=', now)
      .where('lastConfidence', 'in', ['should_know', 'studying'])
      .limit(1)
      .get()

    if (!cardsSnap.empty) {
      await sendPush(uid, {
        title: 'Hora de revisar!',
        body: 'Você tem questões para revisar hoje. Mantenha sua sequência!',
        url: '/revisao',
      }).catch(() => null)
      sent++
    }
  }
  console.log('sendReviewReminder finished', { sent })
})

export const sendStreakReminder = onSchedule('0 0 * * *', async () => {
  console.log('sendStreakReminder started')
  const db = admin.firestore()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const usersSnap = await db
    .collection('users')
    .where('notificationsEnabled', '==', true)
    .get()

  let sent = 0
  for (const userDoc of usersSnap.docs) {
    const activeDays: string[] = userDoc.data()['activeDays'] ?? []
    if (activeDays.includes(yesterdayStr) && !activeDays.includes(new Date().toISOString().split('T')[0])) {
      await sendPush(userDoc.id, {
        title: 'Não quebre sua sequência!',
        body: 'Faça um simulado hoje para manter seus dias consecutivos.',
        url: '/',
      }).catch(() => null)
      sent++
    }
  }
  console.log('sendStreakReminder finished', { sent })
})

export const sendWeeklySimuladoReminder = onSchedule('0 12 * * 1', async () => {
  console.log('sendWeeklySimuladoReminder started')
  const db = admin.firestore()

  const usersSnap = await db
    .collection('users')
    .where('notificationsEnabled', '==', true)
    .get()

  let sent = 0
  for (const userDoc of usersSnap.docs) {
    await sendPush(userDoc.id, {
      title: 'Simulado semanal',
      body: 'Comece a semana praticando! Faça um simulado agora.',
      url: '/',
    }).catch(() => null)
    sent++
  }
  console.log('sendWeeklySimuladoReminder finished', { sent })
})
