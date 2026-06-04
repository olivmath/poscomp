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
exports.deleteAllData = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
async function deleteCollection(db, path) {
    let deleted = 0;
    let query = db.collection(path).limit(400);
    let snap = await query.get();
    while (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
        if (snap.size < 400)
            break;
        snap = await query.get();
    }
    return deleted;
}
exports.deleteAllData = (0, https_1.onCall)(async (request) => {
    const auth = (0, auth_1.requireAuth)(request);
    console.log('deleteAllData started', { uid: auth.uid });
    const db = admin.firestore();
    let totalDeleted = 0;
    try {
        const [srsDeleted, resultsDeleted] = await Promise.all([
            deleteCollection(db, `users/${auth.uid}/srs_cards`),
            deleteCollection(db, `users/${auth.uid}/results`),
        ]);
        totalDeleted = srsDeleted + resultsDeleted;
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Failed to delete data');
    }
    console.log('deleteAllData finished', { uid: auth.uid, deleted: totalDeleted });
    return { deleted: true };
});
//# sourceMappingURL=deleteAllData.js.map