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
exports.deleteAnnouncement = exports.updateAnnouncement = exports.createAnnouncement = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.createAnnouncement = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { message, type, active, url, expiresAt } = request.data;
    console.log('createAnnouncement started');
    if (!message || typeof message !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'message is required');
    }
    if (!['info', 'warning', 'success'].includes(type)) {
        throw new https_1.HttpsError('invalid-argument', 'type must be info, warning, or success');
    }
    const db = admin.firestore();
    const docRef = await db.collection('announcements').add({
        message,
        type,
        active: active ?? true,
        url: url ?? '',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
    });
    console.log('createAnnouncement finished', { id: docRef.id });
    return { id: docRef.id };
});
exports.updateAnnouncement = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id, ...fields } = request.data;
    console.log('updateAnnouncement started', { id });
    if (!id || typeof id !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'id is required');
    }
    const db = admin.firestore();
    const doc = await db.doc(`announcements/${id}`).get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Announcement not found');
    }
    const updates = { ...fields, updatedAt: firestore_1.FieldValue.serverTimestamp() };
    if (typeof updates['expiresAt'] === 'string') {
        updates['expiresAt'] = admin.firestore.Timestamp.fromDate(new Date(updates['expiresAt']));
    }
    await db.doc(`announcements/${id}`).update(updates);
    console.log('updateAnnouncement finished', { id });
    return { success: true };
});
exports.deleteAnnouncement = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    const { id } = request.data;
    console.log('deleteAnnouncement started', { id });
    if (!id || typeof id !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'id is required');
    }
    const db = admin.firestore();
    await db.doc(`announcements/${id}`).delete();
    console.log('deleteAnnouncement finished', { id });
    return { success: true };
});
//# sourceMappingURL=announcements.js.map