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
exports.grantPremiumAdmin = exports.resetUserSrs = exports.enableUser = exports.disableUser = exports.listUsers = exports.revokeAdminRole = exports.setAdminRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.setAdminRole = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { uid } = request.data;
    console.log('setAdminRole started', { uid });
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('setAdminRole finished', { uid });
    return { success: true };
});
exports.revokeAdminRole = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { uid } = request.data;
    console.log('revokeAdminRole started', { uid });
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    await admin.auth().setCustomUserClaims(uid, { admin: false });
    console.log('revokeAdminRole finished', { uid });
    return { success: true };
});
exports.listUsers = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { pageToken } = request.data;
    console.log('listUsers started', { pageToken });
    try {
        const result = await admin.auth().listUsers(100, pageToken || undefined);
        const uids = result.users.map((u) => u.uid);
        // Fetch additional data from Firestore in chunks of 100
        const db = admin.firestore();
        const userDataMap = new Map();
        if (uids.length > 0) {
            const userDocs = await db.getAll(...uids.map((uid) => db.doc(`users/${uid}`)));
            userDocs.forEach((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data)
                        userDataMap.set(doc.id, data);
                }
            });
        }
        const users = result.users.map((u) => {
            const firestoreData = userDataMap.get(u.uid) || {};
            return {
                uid: u.uid,
                email: u.email ?? '',
                displayName: u.displayName ?? '',
                photoURL: u.photoURL ?? '',
                disabled: u.disabled,
                isAdmin: u.customClaims?.['admin'] === true,
                isPremium: firestoreData.isPremium === true,
                planType: firestoreData.planType || 'free',
                premiumExpiresAt: firestoreData.premiumExpiresAt || null,
                createdAt: u.metadata.creationTime,
                lastSignIn: u.metadata.lastSignInTime,
            };
        });
        console.log('listUsers finished', { count: users.length });
        return { users, nextPageToken: result.pageToken || null };
    }
    catch (error) {
        console.error('Error in listUsers:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Error listing users';
        throw new https_1.HttpsError('internal', message);
    }
});
exports.disableUser = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { uid } = request.data;
    console.log('disableUser started', { uid });
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    await admin.auth().updateUser(uid, { disabled: true });
    console.log('disableUser finished', { uid });
    return { success: true };
});
exports.enableUser = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { uid } = request.data;
    console.log('enableUser started', { uid });
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    await admin.auth().updateUser(uid, { disabled: false });
    console.log('enableUser finished', { uid });
    return { success: true };
});
exports.resetUserSrs = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { uid } = request.data;
    console.log('resetUserSrs started', { uid });
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    const db = admin.firestore();
    let deleted = 0;
    let snap = await db.collection(`users/${uid}/srs_cards`).limit(400).get();
    while (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
        if (snap.size < 400)
            break;
        snap = await db.collection(`users/${uid}/srs_cards`).limit(400).get();
    }
    console.log('resetUserSrs finished', { uid, deleted });
    return { success: true, deleted };
});
exports.grantPremiumAdmin = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { uid, planType } = request.data;
    console.log('grantPremiumAdmin started', { uid, planType });
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'uid is required');
    if (planType !== 'pro' && planType !== 'pro_max') {
        throw new https_1.HttpsError('invalid-argument', 'planType must be pro or pro_max');
    }
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (planType === 'pro_max' ? 365 : 30));
    await admin.firestore().doc(`users/${uid}`).set({
        isPremium: true,
        planType,
        premiumStatus: 'active',
        premiumExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        lastActivity: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('grantPremiumAdmin finished', { uid, planType });
    return { success: true };
});
//# sourceMappingURL=users.js.map