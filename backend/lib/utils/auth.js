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
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.requirePremium = requirePremium;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
function requireAuth(request) {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Auth required');
    return request.auth;
}
function requireAdmin(request) {
    const auth = requireAuth(request);
    if (!auth.token['admin'])
        throw new https_1.HttpsError('permission-denied', 'Admin required');
    return auth;
}
async function requirePremium(request) {
    const auth = requireAuth(request);
    const userDoc = await admin.firestore().doc(`users/${auth.uid}`).get();
    const user = userDoc.data();
    if (!user?.isPremium)
        throw new https_1.HttpsError('permission-denied', 'Premium required');
    const expires = user.premiumExpiresAt?.toDate();
    if (expires && expires < new Date()) {
        await admin.firestore().doc(`users/${auth.uid}`).update({ isPremium: false });
        throw new https_1.HttpsError('permission-denied', 'Premium expired');
    }
    return auth;
}
//# sourceMappingURL=auth.js.map