"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimuladoQuestions = void 0;
const https_1 = require("firebase-functions/v2/https");
const index_1 = require("./index");
const types_1 = require("./types");
exports.getSimuladoQuestions = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const input = request.data;
    const { areas, total } = input;
    validateInput(areas, total);
    const questions = await fetchQuestions(areas);
    const selected = shuffleAndSlice(questions, total);
    return { questions: selected };
});
async function fetchQuestions(areas) {
    const col = index_1.db.collection('questions');
    const snapshot = areas.length > 0
        ? await col.where('area', 'in', areas).get()
        : await col.get();
    if (snapshot.empty)
        throw new https_1.HttpsError('not-found', 'No questions found for the given areas');
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
function validateInput(areas, total) {
    if (!Number.isInteger(total) || total <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'total must be a positive integer');
    }
    const invalidAreas = areas.filter((a) => !types_1.VALID_AREAS.includes(a));
    if (invalidAreas.length > 0) {
        throw new https_1.HttpsError('invalid-argument', `Invalid areas: ${invalidAreas.join(', ')}`);
    }
}
function shuffleAndSlice(questions, total) {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, total);
}
//# sourceMappingURL=getSimuladoQuestions.js.map