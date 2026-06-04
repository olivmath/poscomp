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
exports.getMateriaReviewStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
exports.getMateriaReviewStats = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    console.log('getMateriaReviewStats started', { uid: auth.uid });
    const db = admin.firestore();
    let cardsSnap;
    let resultsSnap;
    try {
        ;
        [cardsSnap, resultsSnap] = await Promise.all([
            db.collection(`users/${auth.uid}/srs_cards`).get(),
            db.collection(`users/${auth.uid}/results`).get(),
        ]);
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Firestore error');
    }
    // Group cards by materia
    const materiaMinDueDate = new Map();
    for (const doc of cardsSnap.docs) {
        const card = doc.data();
        const materia = card['materia'];
        const dueDate = card['dueDate'].toDate();
        if (!materiaMinDueDate.has(materia) || dueDate < materiaMinDueDate.get(materia)) {
            materiaMinDueDate.set(materia, dueDate);
        }
    }
    // Collect review dates per materia from results
    const materiaReviewDates = new Map();
    for (const doc of resultsSnap.docs) {
        const result = doc.data();
        const completedAt = result['completedAt']?.toDate().toISOString().split('T')[0] ?? '';
        const breakdown = result['materiaBreakdown'];
        if (breakdown) {
            for (const materia of Object.keys(breakdown)) {
                if (!materiaReviewDates.has(materia))
                    materiaReviewDates.set(materia, []);
                if (completedAt)
                    materiaReviewDates.get(materia).push(completedAt);
            }
        }
    }
    // Build output — only materias that have SRS cards
    const materias = Array.from(materiaMinDueDate.entries()).map(([materia, minDue]) => {
        const allDates = (materiaReviewDates.get(materia) ?? []).sort();
        const reviewDates = allDates.slice(-10); // last 10
        return {
            materia,
            reviewDates,
            nextDueDate: minDue.toISOString(),
        };
    });
    // Sort by nextDueDate ASC, nulls last (no nulls since all have SRS cards)
    materias.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    console.log('getMateriaReviewStats finished', { uid: auth.uid, materias: materias.length });
    return { materias };
});
//# sourceMappingURL=getMateriaReviewStats.js.map