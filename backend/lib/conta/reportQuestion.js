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
exports.reportQuestion = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.reportQuestion = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    const { questionId, comment } = request.data;
    console.log('reportQuestion started', { uid: auth.uid, questionId });
    if (!Number.isInteger(questionId) || questionId <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'questionId must be a positive integer');
    }
    const db = admin.firestore();
    try {
        await db.collection('flagged_questions').add({
            uid: auth.uid,
            questionId,
            comment: comment ?? '',
            resolved: false,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Failed to report question');
    }
    console.log('reportQuestion finished', { uid: auth.uid, questionId });
    return { success: true };
});
//# sourceMappingURL=reportQuestion.js.map