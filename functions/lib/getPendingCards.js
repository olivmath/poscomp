"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingCards = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const index_1 = require("./index");
exports.getPendingCards = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const uid = request.auth.uid;
    const dueCards = await fetchDueCards(uid);
    if (dueCards.length === 0)
        return { cards: [] };
    const questionIds = dueCards.map((c) => c.questionId);
    const questionsMap = await fetchQuestionsMap(questionIds);
    const cards = buildOutput(dueCards, questionsMap);
    return { cards };
});
async function fetchDueCards(uid) {
    const now = firestore_1.Timestamp.now();
    const snapshot = await index_1.db
        .collection(`users/${uid}/srs_cards`)
        .where('dueDate', '<=', now)
        .get();
    return snapshot.docs.map((doc) => doc.data());
}
async function fetchQuestionsMap(questionIds) {
    const chunks = chunkArray(questionIds, 30);
    const map = new Map();
    for (const chunk of chunks) {
        const snapshot = await index_1.db.collection('questions').where('__name__', 'in', chunk).get();
        for (const doc of snapshot.docs) {
            map.set(doc.id, { id: doc.id, ...doc.data() });
        }
    }
    return map;
}
function buildOutput(cards, questionsMap) {
    const withPriority = cards
        .filter((c) => c.lastConfidence !== null)
        .map((card) => ({
        card,
        priority: confidenceToPriority(card.lastConfidence),
    }));
    withPriority.sort((a, b) => {
        if (a.priority !== b.priority)
            return a.priority.localeCompare(b.priority);
        return a.card.dueDate.toMillis() - b.card.dueDate.toMillis();
    });
    return withPriority
        .filter(({ card }) => questionsMap.has(card.questionId))
        .map(({ card, priority }) => {
        const q = questionsMap.get(card.questionId);
        const questionOut = {
            id: q.id,
            ano: q.ano,
            area: q.area,
            enunciado: q.enunciado,
            alternativas: q.alternativas,
            resposta: q.resposta,
            ...(q.comentario !== undefined ? { comentario: q.comentario } : {}),
        };
        return {
            questionId: card.questionId,
            priority,
            lastConfidence: card.lastConfidence,
            dueDate: card.dueDate.toDate().toISOString(),
            repetitions: card.repetitions,
            easeFactor: card.easeFactor,
            interval: card.interval,
            question: questionOut,
        };
    });
}
function confidenceToPriority(confidence) {
    switch (confidence) {
        case 'should_know': return 'P1';
        case 'studying': return 'P2';
        case 'unsure': return 'P3';
    }
}
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
//# sourceMappingURL=getPendingCards.js.map