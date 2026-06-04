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
exports.getPixConfig = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
const QRCode = __importStar(require("qrcode"));
exports.getPixConfig = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    const { planType } = request.data;
    console.log('getPixConfig started', { uid: auth.uid, planType });
    if (planType !== 'pro' && planType !== 'pro_max') {
        throw new https_1.HttpsError('invalid-argument', 'planType must be pro or pro_max');
    }
    const pixKey = process.env.PIX_KEY;
    if (!pixKey) {
        throw new https_1.HttpsError('internal', 'PIX_KEY not configured');
    }
    const transactionId = admin.firestore().collection('premium_requests').doc().id;
    const pixCopyPaste = `PIX:${pixKey}:${transactionId}`;
    let pixQrBase64;
    try {
        pixQrBase64 = await QRCode.toDataURL(pixCopyPaste, { width: 200 });
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Failed to generate QR code');
    }
    try {
        await admin.firestore().doc(`premium_requests/${transactionId}`).set({
            uid: auth.uid,
            status: 'awaiting_receipt',
            planType,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Failed to create premium request');
    }
    console.log('getPixConfig finished', { uid: auth.uid, transactionId });
    return { transactionId, pixQrBase64, pixCopyPaste };
});
//# sourceMappingURL=getPixConfig.js.map