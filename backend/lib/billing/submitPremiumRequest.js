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
exports.submitPremiumRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.submitPremiumRequest = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    const { transactionId, fileBase64, receiptType } = request.data;
    console.log('submitPremiumRequest started', { uid: auth.uid, transactionId });
    if (!transactionId || typeof transactionId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'transactionId is required');
    }
    if (!fileBase64 || typeof fileBase64 !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'fileBase64 is required');
    }
    if (!receiptType || typeof receiptType !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'receiptType is required');
    }
    if (!receiptType.startsWith('image/') && receiptType !== 'application/pdf') {
        throw new https_1.HttpsError('invalid-argument', 'receiptType must be image/* or application/pdf');
    }
    const db = admin.firestore();
    const requestDoc = await db.doc(`premium_requests/${transactionId}`).get();
    if (!requestDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Transaction not found');
    }
    const requestData = requestDoc.data();
    if (requestData['uid'] !== auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'Transaction does not belong to you');
    }
    if (requestData['status'] !== 'awaiting_receipt') {
        throw new https_1.HttpsError('failed-precondition', 'Transaction already submitted');
    }
    // Upload file to Storage via admin SDK
    const timestamp = Date.now();
    const ext = receiptType === 'application/pdf' ? 'pdf' : receiptType.split('/')[1] ?? 'jpg';
    const fileName = `${timestamp}.${ext}`;
    const storagePath = `receipts/${auth.uid}/${transactionId}_${fileName}`;
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const buffer = Buffer.from(fileBase64, 'base64');
    try {
        await file.save(buffer, { contentType: receiptType });
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Failed to upload file');
    }
    await db.doc(`premium_requests/${transactionId}`).update({
        status: 'pending',
        storagePath,
        receiptType,
        submittedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log('submitPremiumRequest finished', { uid: auth.uid, transactionId, storagePath });
    return { success: true };
});
//# sourceMappingURL=submitPremiumRequest.js.map