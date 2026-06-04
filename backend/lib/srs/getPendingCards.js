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
exports.getPendingCards = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const chunks_1 = require("../utils/chunks");
exports.getPendingCards = (0, https_1.onCall)(async (request) => {
    const auth = await (0, auth_1.requirePremium)(request);
    console.log('getPendingCards started', { uid: auth.uid });
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    let snap;
    try {
        snap = await db
            .collection(`users/${auth.uid}/srs_cards`)
            .where('dueDate', '<=', now)
            .get();
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Firestore error');
    }
    const filtered = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.lastConfidence === 'should_know' || c.lastConfidence === 'studying');
    // Fetch questions in chunks
    const questionIds = filtered.map((c) => c.questionId);
    const questionMap = new Map();
    if (questionIds.length > 0) {
        const chunks = (0, chunks_1.chunkArray)(questionIds, 30);
        for (const chunk of chunks) {
            const docRefs = chunk.map((id) => db.doc(`questions/${id}`));
            const docSnaps = await db.getAll(...docRefs);
            for (const d of docSnaps) {
                if (d.exists) {
                    const q = d.data();
                    questionMap.set(q.id, q);
                }
            }
        }
    }
    const priorityMap = {
        should_know: 'P1',
        studying: 'P2',
        unsure: 'P3',
    };
    const cards = filtered
        .map((c) => ({
        questionId: c.questionId,
        priority: priorityMap[c.lastConfidence],
        lastConfidence: c.lastConfidence,
        dueDate: c.dueDate.toDate().toISOString(),
        repetitions: c.repetitions,
        easeFactor: c.easeFactor,
        interval: c.interval,
        question: questionMap.get(c.questionId) ?? null,
    }))
        .sort((a, b) => {
        if (a.priority !== b.priority)
            return a.priority < b.priority ? -1 : 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    console.log('getPendingCards finished', { uid: auth.uid, count: cards.length });
    return { cards };
});
//# sourceMappingURL=getPendingCards.js.map