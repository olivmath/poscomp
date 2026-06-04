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
exports.reviewPremiumRequest = exports.listPremiumRequests = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
const notifications_1 = require("../background/notifications");
exports.listPremiumRequests = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    console.log('listPremiumRequests started');
    const db = admin.firestore();
    const snap = await db.collection('premium_requests').orderBy('createdAt', 'desc').get();
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log('listPremiumRequests finished', { count: requests.length });
    return { requests };
});
exports.reviewPremiumRequest = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAdmin)(request);
    const { requestId, action } = request.data;
    console.log('reviewPremiumRequest started', { uid: auth.uid, requestId, action });
    if (!requestId || typeof requestId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'requestId is required');
    }
    if (action !== 'approve' && action !== 'deny') {
        throw new https_1.HttpsError('invalid-argument', 'action must be approve or deny');
    }
    const db = admin.firestore();
    const reqDoc = await db.doc(`premium_requests/${requestId}`).get();
    if (!reqDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Request not found');
    }
    const reqData = reqDoc.data();
    if (reqData['status'] !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', 'Request is not in pending state');
    }
    const targetUid = reqData['uid'];
    const planType = reqData['planType'];
    if (action === 'approve') {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + (planType === 'pro_max' ? 365 : 30));
        const batch = db.batch();
        batch.update(db.doc(`premium_requests/${requestId}`), {
            status: 'approved',
            reviewedAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedBy: auth.uid,
        });
        batch.set(db.doc(`users/${targetUid}`), {
            isPremium: true,
            planType,
            premiumStatus: 'active',
            premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        }, { merge: true });
        await batch.commit();
        // Fire-and-forget notification
        (0, notifications_1.sendPush)(targetUid, {
            title: 'Premium ativado!',
            body: 'Sua assinatura foi aprovada. Aproveite o acesso completo ao POSCOMP App.',
            url: '/perfil',
        }).catch((e) => console.warn('Failed to send premium approved notification', e));
    }
    else {
        await db.doc(`premium_requests/${requestId}`).update({
            status: 'denied',
            reviewedAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedBy: auth.uid,
        });
    }
    console.log('reviewPremiumRequest finished', { uid: auth.uid, requestId, action });
    return { success: true };
});
//# sourceMappingURL=premium.js.map