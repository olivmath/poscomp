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
exports.registerFcmToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.registerFcmToken = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    const { token } = request.data;
    console.log('registerFcmToken started', { uid: auth.uid });
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'token is required and must be a non-empty string');
    }
    // Basic FCM token format validation: alphanumeric + : - _ .
    if (!/^[A-Za-z0-9:_\-./]+$/.test(token)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid FCM token format');
    }
    const db = admin.firestore();
    await db.doc(`users/${auth.uid}`).set({
        fcmTokens: firestore_1.FieldValue.arrayUnion(token),
    }, { merge: true });
    console.log('registerFcmToken finished', { uid: auth.uid });
    return { success: true };
});
//# sourceMappingURL=registerFcmToken.js.map