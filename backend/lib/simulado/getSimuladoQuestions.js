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
exports.getSimuladoQuestions = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const types_1 = require("../types");
exports.getSimuladoQuestions = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    const { materias, total } = request.data;
    console.log('getSimuladoQuestions started', { uid: auth.uid, materias, total });
    if (!Number.isInteger(total) || total <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'total must be a positive integer');
    }
    if (!Array.isArray(materias)) {
        throw new https_1.HttpsError('invalid-argument', 'materias must be an array');
    }
    if (materias.length > 0) {
        for (const m of materias) {
            if (!types_1.VALID_MATERIAS.includes(m)) {
                throw new https_1.HttpsError('invalid-argument', `Invalid materia: ${m}`);
            }
        }
    }
    const db = admin.firestore();
    let query = db.collection('questions');
    if (materias.length > 0) {
        query = query.where('materia', 'in', materias);
    }
    let snapshot;
    try {
        snapshot = await query.get();
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Firestore error');
    }
    if (snapshot.empty) {
        throw new https_1.HttpsError('not-found', 'No questions found for selected areas');
    }
    const questions = snapshot.docs.map((d) => d.data());
    questions.sort(() => Math.random() - 0.5);
    const result = questions.slice(0, total);
    console.log('getSimuladoQuestions finished', { uid: auth.uid, returned: result.length });
    return { questions: result };
});
//# sourceMappingURL=getSimuladoQuestions.js.map