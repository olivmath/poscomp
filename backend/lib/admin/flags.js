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
exports.deleteFlaggedQuestion = exports.resolveFlaggedQuestion = exports.getFlaggedQuestions = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.getFlaggedQuestions = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { limit: queryLimit, startAfter } = request.data;
    console.log('getFlaggedQuestions started');
    const db = admin.firestore();
    const pageSize = queryLimit && queryLimit > 0 ? queryLimit : 50;
    let query = db
        .collection('flagged_questions')
        .where('resolved', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(pageSize);
    if (startAfter) {
        const cursorDoc = await db.doc(`flagged_questions/${startAfter}`).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }
    const snap = await query.get();
    const flags = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data()['createdAt']?.toDate().toISOString(),
    }));
    console.log('getFlaggedQuestions finished', { count: flags.length });
    return { flags };
});
exports.resolveFlaggedQuestion = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id } = request.data;
    console.log('resolveFlaggedQuestion started', { id });
    if (!id || typeof id !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'id is required');
    }
    const db = admin.firestore();
    const doc = await db.doc(`flagged_questions/${id}`).get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Flagged question not found');
    }
    await db.doc(`flagged_questions/${id}`).update({
        resolved: true,
        resolvedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log('resolveFlaggedQuestion finished', { id });
    return { success: true };
});
exports.deleteFlaggedQuestion = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id } = request.data;
    console.log('deleteFlaggedQuestion started', { id });
    if (!id || typeof id !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'id is required');
    }
    const db = admin.firestore();
    await db.doc(`flagged_questions/${id}`).delete();
    console.log('deleteFlaggedQuestion finished', { id });
    return { success: true };
});
//# sourceMappingURL=flags.js.map