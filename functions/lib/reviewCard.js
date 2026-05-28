"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCard = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const index_1 = require("./index");
exports.reviewCard = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const uid = request.auth.uid;
    const { questionId, studied } = request.data;
    if (!questionId || typeof questionId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'questionId is required');
    }
    const cardRef = index_1.db.doc(`users/${uid}/srs_cards/${questionId}`);
    return index_1.db.runTransaction(async (txn) => {
        const snap = await txn.get(cardRef);
        if (!snap.exists) {
            throw new https_1.HttpsError('not-found', `SRS card not found: ${questionId}`);
        }
        const card = snap.data();
        const updated = applySm2(card, studied);
        txn.update(cardRef, {
            interval: updated.newInterval,
            easeFactor: updated.newEaseFactor,
            repetitions: updated.newRepetitions,
            dueDate: firestore_1.Timestamp.fromDate(new Date(updated.nextDueDate)),
            studied: true,
        });
        return updated;
    });
});
function applySm2(card, studied) {
    let { interval, easeFactor, repetitions } = card;
    if (studied) {
        interval = Math.round(interval * easeFactor);
        easeFactor = easeFactor + 0.1;
        repetitions = repetitions + 1;
    }
    else {
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        repetitions = 0;
    }
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + interval);
    return {
        nextDueDays: interval,
        nextDueDate: nextDueDate.toISOString(),
        newInterval: interval,
        newEaseFactor: easeFactor,
        newRepetitions: repetitions,
    };
}
//# sourceMappingURL=reviewCard.js.map