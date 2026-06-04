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
exports.getResult = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
exports.getResult = (0, https_1.onCall)(async (request) => {
    const auth = await (0, auth_1.requirePremium)(request);
    const { resultId } = request.data;
    console.log('getResult started', { uid: auth.uid, resultId });
    if (!resultId || typeof resultId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'resultId is required');
    }
    const db = admin.firestore();
    let doc;
    try {
        doc = await db.doc(`users/${auth.uid}/results/${resultId}`).get();
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Firestore error');
    }
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Result not found');
    }
    const data = doc.data();
    console.log('getResult finished', { uid: auth.uid, resultId });
    return {
        resultId: doc.id,
        score: data['score'],
        totalQuestions: data['totalQuestions'],
        timeSpentSeconds: data['timeSpentSeconds'],
        completedAt: data['completedAt']?.toDate().toISOString() ?? new Date().toISOString(),
        materiaBreakdown: data['materiaBreakdown'],
        answers: data['answers'],
    };
});
//# sourceMappingURL=getResult.js.map