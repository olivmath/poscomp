import * as admin from 'firebase-admin'
import { getMessaging } from 'firebase-admin/messaging'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { db } from './index'

const messaging = getMessaging()

interface UserNotifData {
  uid: string
  fcmTokens: string[]
}

async function getUsersWithTokens(): Promise<UserNotifData[]> {
  const snap = await db
    .collection('users')
    .where('notificationsEnabled', '==', true)
    .get()
  return snap.docs
    .map((d) => ({ uid: d.id, fcmTokens: (d.data().fcmTokens as string[]) ?? [] }))
    .filter((u) => u.fcmTokens.length > 0)
}

async function sendPushToUser(
  uid: string,
  tokens: string[],
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!tokens.length) return
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      fcmOptions: { link: payload.url ?? '/' },
      notification: { icon: '/vite.svg', badge: '/vite.svg', vibrate: [200, 100, 200] },
    },
    data: { url: payload.url ?? '/' },
  })

  // Remove tokens that are no longer valid
  const invalidTokens: string[] = []
  result.responses.forEach((resp, idx) => {
    const token = tokens[idx]
    if (!resp.success && token && (
      resp.error?.code === 'messaging/registration-token-not-registered' ||
      resp.error?.code === 'messaging/invalid-registration-token'
    )) {
      invalidTokens.push(token)
    }
  })
  if (invalidTokens.length > 0) {
    await db.collection('users').doc(uid).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
    })
    logger.info('[notifications] tokens inválidos removidos', { uid, count: invalidTokens.length })
  }
}

// ── #1 Revisão pendente — todo dia às 9h BRT (12h UTC) ──────────────────────
export const sendReviewReminder = onSchedule(
  { schedule: '0 12 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger.info('[sendReviewReminder] iniciado')
    const now = admin.firestore.Timestamp.now()
    const users = await getUsersWithTokens()

    let sent = 0
    for (const { uid, fcmTokens } of users) {
      const pending = await db
        .collection(`users/${uid}/srs_cards`)
        .where('dueDate', '<=', now)
        .limit(1)
        .get()
      if (pending.empty) continue

      const total = await db
        .collection(`users/${uid}/srs_cards`)
        .where('dueDate', '<=', now)
        .count()
        .get()
      const count = total.data().count

      await sendPushToUser(uid, fcmTokens, {
        title: 'Hora de revisar!',
        body: `Você tem ${count} card${count > 1 ? 's' : ''} para revisar hoje.`,
        url: '/revisao',
      })
      sent++
    }
    logger.info('[sendReviewReminder] concluído', { sent })
  },
)

// ── #2 Streak em risco — todo dia às 21h BRT (0h UTC do dia seguinte) ───────
export const sendStreakReminder = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger.info('[sendStreakReminder] iniciado')
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    )
    const snap = await db
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .where('lastActivity', '<=', cutoff)
      .get()

    let sent = 0
    for (const doc of snap.docs) {
      const tokens: string[] = doc.data().fcmTokens ?? []
      if (!tokens.length) continue
      await sendPushToUser(doc.id, tokens, {
        title: 'Não quebre seu ritmo!',
        body: 'Você não estudou hoje. Reserve 5 minutos para revisão.',
        url: '/revisao',
      })
      sent++
    }
    logger.info('[sendStreakReminder] concluído', { sent })
  },
)

// ── #3 Lembrete semanal de simulado — toda segunda às 9h BRT ─────────────────
export const sendWeeklySimuladoReminder = onSchedule(
  { schedule: '0 12 * * 1', timeZone: 'America/Sao_Paulo' },
  async () => {
    logger.info('[sendWeeklySimuladoReminder] iniciado')
    const users = await getUsersWithTokens()
    let sent = 0
    for (const { uid, fcmTokens } of users) {
      await sendPushToUser(uid, fcmTokens, {
        title: 'Simulado semanal',
        body: 'Que tal testar seus conhecimentos com um simulado esta semana?',
        url: '/',
      })
      sent++
    }
    logger.info('[sendWeeklySimuladoReminder] concluído', { sent })
  },
)

// Exporta helper para ser chamado internamente pelo premiumRequests
export async function notifyPremiumApproved(uid: string): Promise<void> {
  const snap = await db.collection('users').doc(uid).get()
  const tokens: string[] = snap.data()?.fcmTokens ?? []
  if (!tokens.length) return
  await sendPushToUser(uid, tokens, {
    title: 'Premium ativado!',
    body: 'Sua assinatura foi aprovada. Aproveite o acesso completo ao POSCOMP App.',
    url: '/perfil',
  })
}
