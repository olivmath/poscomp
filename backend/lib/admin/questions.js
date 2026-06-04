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
exports.deleteQuestion = exports.updateQuestion = exports.createQuestion = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
const types_1 = require("../types");
exports.createQuestion = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const data = request.data;
    console.log('createQuestion started');
    if (!data.ano || !data.materia || !data.enunciado || !data.alternativas || !data.resposta) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required question fields');
    }
    if (!types_1.VALID_MATERIAS.includes(data.materia)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid materia');
    }
    if (!types_1.VALID_OPTIONS.includes(data.resposta)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid resposta');
    }
    const db = admin.firestore();
    // Get max id
    const snap = await db.collection('questions').orderBy('id', 'desc').limit(1).get();
    const nextId = snap.empty ? 1 : snap.docs[0].data()['id'] + 1;
    await db.doc(`questions/${nextId}`).set({
        ...data,
        id: nextId,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log('createQuestion finished', { id: nextId });
    return { id: nextId };
});
exports.updateQuestion = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id, ...fields } = request.data;
    console.log('updateQuestion started', { id });
    if (!Number.isInteger(id) || id <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'id must be a positive integer');
    }
    const db = admin.firestore();
    const doc = await db.doc(`questions/${id}`).get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', `Question ${id} not found`);
    }
    await db.doc(`questions/${id}`).update({ ...fields, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    console.log('updateQuestion finished', { id });
    return { success: true };
});
exports.deleteQuestion = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id } = request.data;
    console.log('deleteQuestion started', { id });
    if (!Number.isInteger(id) || id <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'id must be a positive integer');
    }
    const db = admin.firestore();
    // Soft delete
    await db.doc(`questions/${id}`).update({
        deleted: true,
        deletedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log('deleteQuestion finished', { id });
    return { success: true };
});
//# sourceMappingURL=questions.js.map