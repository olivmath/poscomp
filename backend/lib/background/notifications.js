"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWeeklySimuladoReminder = exports.sendStreakReminder = exports.sendReviewReminder = void 0;
exports.sendPush = sendPush;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
async function sendPush(uid, payload) {
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    if (!userDoc.exists)
        return;
    const tokens = userDoc.data()?.['fcmTokens'] ?? [];
    if (tokens.length === 0)
        return;
    const message = {
        tokens,
        notification: { title: payload.title, body: payload.body },
        webpush: payload.url
            ? { fcmOptions: { link: payload.url } }
            : undefined,
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
        if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[i]);
        }
    });
    if (invalidTokens.length > 0) {
        const { FieldValue } = await Promise.resolve().then(() => __importStar(require('firebase-admin/firestore')));
        await admin.firestore().doc(`users/${uid}`).update({
            fcmTokens: FieldValue.arrayRemove(...invalidTokens),
        });
    }
}
exports.sendReviewReminder = (0, scheduler_1.onSchedule)('0 12 * * *', async () => {
    console.log('sendReviewReminder started');
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
    let sent = 0;
    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const cardsSnap = await db
            .collection(`users/${uid}/srs_cards`)
            .where('dueDate', '<=', now)
            .where('lastConfidence', 'in', ['should_know', 'studying'])
            .limit(1)
            .get();
        if (!cardsSnap.empty) {
            await sendPush(uid, {
                title: 'Hora de revisar!',
                body: 'Você tem questões para revisar hoje. Mantenha sua sequência!',
                url: '/revisao',
            }).catch(() => null);
            sent++;
        }
    }
    console.log('sendReviewReminder finished', { sent });
});
exports.sendStreakReminder = (0, scheduler_1.onSchedule)('0 0 * * *', async () => {
    console.log('sendStreakReminder started');
    const db = admin.firestore();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
    let sent = 0;
    for (const userDoc of usersSnap.docs) {
        const activeDays = userDoc.data()['activeDays'] ?? [];
        if (activeDays.includes(yesterdayStr) && !activeDays.includes(new Date().toISOString().split('T')[0])) {
            await sendPush(userDoc.id, {
                title: 'Não quebre sua sequência!',
                body: 'Faça um simulado hoje para manter seus dias consecutivos.',
                url: '/',
            }).catch(() => null);
            sent++;
        }
    }
    console.log('sendStreakReminder finished', { sent });
});
exports.sendWeeklySimuladoReminder = (0, scheduler_1.onSchedule)('0 12 * * 1', async () => {
    console.log('sendWeeklySimuladoReminder started');
    const db = admin.firestore();
    const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
    let sent = 0;
    for (const userDoc of usersSnap.docs) {
        await sendPush(userDoc.id, {
            title: 'Simulado semanal',
            body: 'Comece a semana praticando! Faça um simulado agora.',
            url: '/',
        }).catch(() => null);
        sent++;
    }
    console.log('sendWeeklySimuladoReminder finished', { sent });
});
//# sourceMappingURL=notifications.js.map