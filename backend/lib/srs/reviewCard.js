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
exports.reviewCard = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
const sm2_1 = require("../utils/sm2");
exports.reviewCard = (0, https_1.onCall)(async (request) => {
    const auth = await (0, auth_1.requirePremium)(request);
    const { questionId, studied } = request.data;
    console.log('reviewCard started', { uid: auth.uid, questionId, studied });
    if (!Number.isInteger(questionId) || questionId <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'questionId must be a positive integer');
    }
    if (typeof studied !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'studied must be a boolean');
    }
    const db = admin.firestore();
    const cardRef = db.doc(`users/${auth.uid}/srs_cards/${questionId}`);
    const result = await db.runTransaction(async (tx) => {
        const cardSnap = await tx.get(cardRef);
        if (!cardSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Card not found — question was never answered in a simulado');
        }
        const card = cardSnap.data();
        const { interval, easeFactor, repetitions, nextDueDate } = (0, sm2_1.applySm2)({
            interval: card['interval'],
            easeFactor: card['easeFactor'],
            repetitions: card['repetitions'],
        }, studied);
        const dueTimestamp = admin.firestore.Timestamp.fromDate(nextDueDate);
        const today = new Date().toISOString().split('T')[0];
        tx.update(cardRef, {
            interval,
            easeFactor,
            repetitions,
            dueDate: dueTimestamp,
            studied: true,
        });
        tx.set(db.doc(`users/${auth.uid}`), {
            lastActivity: firestore_1.FieldValue.serverTimestamp(),
            activeDays: firestore_1.FieldValue.arrayUnion(today),
        }, { merge: true });
        return { interval, easeFactor, repetitions, nextDueDate };
    });
    console.log('reviewCard finished', { uid: auth.uid, questionId, nextInterval: result.interval });
    return {
        nextDueDays: result.interval,
        nextDueDate: result.nextDueDate.toISOString(),
        newInterval: result.interval,
        newEaseFactor: result.easeFactor,
        newRepetitions: result.repetitions,
    };
});
//# sourceMappingURL=reviewCard.js.map