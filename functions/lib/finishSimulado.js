"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishSimulado = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const index_1 = require("./index");
const types_1 = require("./types");
exports.finishSimulado = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const uid = request.auth.uid;
    const input = request.data;
    validateInput(input);
    const { answers, timeSpentSeconds } = input;
    const questionIds = answers.map((a) => a.questionId);
    const questionsMap = await fetchQuestionsMap(questionIds);
    const answersOutput = buildAnswersOutput(answers, questionsMap);
    const areaBreakdown = buildAreaBreakdown(answersOutput, questionsMap);
    const score = answersOutput.filter((a) => a.correct).length;
    const resultId = await saveResult(uid, {
        answers: answersOutput,
        areaBreakdown,
        score,
        totalQuestions: answers.length,
        timeSpentSeconds,
    });
    await updateSrsCards(uid, answers, questionsMap);
    return {
        resultId,
        score,
        totalQuestions: answers.length,
        timeSpentSeconds,
        areaBreakdown,
        answers: answersOutput,
    };
});
function validateInput(input) {
    const { answers, timeSpentSeconds } = input;
    if (!Array.isArray(answers) || answers.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'answers must be a non-empty array');
    }
    if (typeof timeSpentSeconds !== 'number' || timeSpentSeconds < 0) {
        throw new https_1.HttpsError('invalid-argument', 'timeSpentSeconds must be >= 0');
    }
    for (const answer of answers) {
        if (!types_1.VALID_OPTIONS.includes(answer.selected)) {
            throw new https_1.HttpsError('invalid-argument', `Invalid option: ${answer.selected}`);
        }
        if (!types_1.VALID_CONFIDENCES.includes(answer.confidence)) {
            throw new https_1.HttpsError('invalid-argument', `Invalid confidence: ${answer.confidence}`);
        }
        if (!answer.questionId || typeof answer.questionId !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'Each answer must have a questionId');
        }
    }
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
    const missing = questionIds.filter((id) => !map.has(id));
    if (missing.length > 0) {
        throw new https_1.HttpsError('not-found', `Questions not found: ${missing.join(', ')}`);
    }
    return map;
}
function buildAnswersOutput(answers, questionsMap) {
    return answers.map((answer) => {
        const question = questionsMap.get(answer.questionId);
        const correct = answer.selected === question.resposta;
        const questionOut = {
            enunciado: question.enunciado,
            alternativas: question.alternativas,
            resposta: question.resposta,
            ...(question.comentario !== undefined ? { comentario: question.comentario } : {}),
        };
        return {
            questionId: answer.questionId,
            selected: answer.selected,
            correct,
            confidence: answer.confidence,
            question: questionOut,
        };
    });
}
function buildAreaBreakdown(answersOutput, questionsMap) {
    const breakdown = {};
    for (const answer of answersOutput) {
        const question = questionsMap.get(answer.questionId);
        const area = question.area;
        if (!breakdown[area])
            breakdown[area] = { correct: 0, total: 0 };
        const entry = breakdown[area];
        entry.total += 1;
        if (answer.correct)
            entry.correct += 1;
    }
    return breakdown;
}
async function saveResult(uid, data) {
    const ref = await index_1.db.collection(`users/${uid}/results`).add({
        ...data,
        completedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return ref.id;
}
async function updateSrsCards(uid, answers, questionsMap) {
    const batch = index_1.db.batch();
    const now = firestore_1.Timestamp.now();
    for (const answer of answers) {
        const question = questionsMap.get(answer.questionId);
        const correct = answer.selected === question.resposta;
        const cardRef = index_1.db.doc(`users/${uid}/srs_cards/${answer.questionId}`);
        const cardSnap = await cardRef.get();
        if (cardSnap.exists) {
            batch.update(cardRef, {
                lastConfidence: answer.confidence,
                dueDate: now,
                simuladoCorrect: correct,
            });
        }
        else {
            batch.set(cardRef, {
                questionId: answer.questionId,
                easeFactor: 2.5,
                interval: 1,
                repetitions: 0,
                dueDate: now,
                createdAt: now,
                lastConfidence: answer.confidence,
                studied: false,
                simuladoCorrect: correct,
            });
        }
    }
    await batch.commit();
}
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
//# sourceMappingURL=finishSimulado.js.map