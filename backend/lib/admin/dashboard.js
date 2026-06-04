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
exports.getAdminDashboard = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.getAdminDashboard = (0, https_1.onCall)(async (request) => {
    (0, auth_1.requireAdmin)(request);
    console.log('getAdminDashboard started');
    const db = admin.firestore();
    // Fetch users and premium_requests in parallel
    let usersSnap;
    let requestsSnap;
    try {
        ;
        [usersSnap, requestsSnap] = await Promise.all([
            db.collection('users').get(),
            db.collection('premium_requests').get(),
        ]);
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Firestore error');
    }
    // totalUsers via Auth Admin SDK
    let totalUsers = 0;
    try {
        let pageToken;
        do {
            const result = await admin.auth().listUsers(1000, pageToken);
            totalUsers += result.users.length;
            pageToken = result.pageToken;
        } while (pageToken);
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Auth SDK error');
    }
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const wauCutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const mauCutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const cohortCutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    let dau = 0, wau = 0, mau = 0;
    const usersByPlan = { free: 0, pro: 0, pro_max: 0 };
    let premiumExpiringIn7Days = 0;
    let premiumExpiringIn30Days = 0;
    let expiredPremium = 0;
    // Retention cohort
    let cohortTotal = 0;
    let retD1 = 0, retD7 = 0, retD30 = 0;
    const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    for (const doc of usersSnap.docs) {
        const u = doc.data();
        const planType = u['planType'] ?? 'free';
        usersByPlan[planType] = (usersByPlan[planType] ?? 0) + 1;
        const lastActivity = u['lastActivity']?.toDate() ?? null;
        if (lastActivity) {
            if (lastActivity >= todayStart)
                dau++;
            if (lastActivity >= wauCutoff)
                wau++;
            if (lastActivity >= mauCutoff)
                mau++;
        }
        const premiumExpiresAt = u['premiumExpiresAt']?.toDate() ?? null;
        if (premiumExpiresAt) {
            if (premiumExpiresAt < now) {
                if (u['isPremium'] === false)
                    expiredPremium++;
            }
            else if (premiumExpiresAt <= in7Days) {
                premiumExpiringIn7Days++;
            }
            else if (premiumExpiresAt <= in30Days) {
                premiumExpiringIn30Days++;
            }
        }
        // Retention cohort
        const createdAt = u['createdAt']?.toDate() ?? null;
        if (createdAt && createdAt >= cohortCutoff) {
            cohortTotal++;
            const activeDays = u['activeDays'] ?? [];
            const activeDaysSet = new Set(activeDays);
            const d1 = new Date(createdAt);
            d1.setDate(d1.getDate() + 1);
            if (activeDaysSet.has(d1.toISOString().split('T')[0]))
                retD1++;
            let d7 = false;
            for (let i = 2; i <= 7; i++) {
                const d = new Date(createdAt);
                d.setDate(d.getDate() + i);
                if (activeDaysSet.has(d.toISOString().split('T')[0])) {
                    d7 = true;
                    break;
                }
            }
            if (d7)
                retD7++;
            let d30 = false;
            for (let i = 8; i <= 30; i++) {
                const d = new Date(createdAt);
                d.setDate(d.getDate() + i);
                if (activeDaysSet.has(d.toISOString().split('T')[0])) {
                    d30 = true;
                    break;
                }
            }
            if (d30)
                retD30++;
        }
    }
    // Premium funnel
    let pending = 0, approved = 0, denied = 0;
    let totalApprovalMs = 0;
    let approvedCount = 0;
    for (const doc of requestsSnap.docs) {
        const r = doc.data();
        const status = r['status'];
        if (status === 'pending')
            pending++;
        else if (status === 'approved') {
            approved++;
            const createdAt = r['createdAt']?.toDate() ?? null;
            const reviewedAt = r['reviewedAt']?.toDate() ?? null;
            if (createdAt && reviewedAt) {
                totalApprovalMs += reviewedAt.getTime() - createdAt.getTime();
                approvedCount++;
            }
        }
        else if (status === 'denied')
            denied++;
    }
    const totalRequests = requestsSnap.size;
    const approvalRatePct = approved + denied > 0 ? Math.round((approved / (approved + denied)) * 100) : 0;
    const avgApprovalTimeHours = approvedCount > 0 ? totalApprovalMs / approvedCount / 3600000 : 0;
    console.log('getAdminDashboard finished');
    return {
        totalUsers,
        usersByPlan,
        dau,
        wau,
        mau,
        retention: {
            d1: cohortTotal > 0 ? Math.round((retD1 / cohortTotal) * 100) : 0,
            d7: cohortTotal > 0 ? Math.round((retD7 / cohortTotal) * 100) : 0,
            d30: cohortTotal > 0 ? Math.round((retD30 / cohortTotal) * 100) : 0,
        },
        premiumFunnel: {
            total: totalRequests,
            pending,
            approved,
            denied,
            approvalRatePct,
            avgApprovalTimeHours,
        },
        premiumExpiringIn7Days,
        premiumExpiringIn30Days,
        expiredPremium,
        computedAt: firestore_1.FieldValue.serverTimestamp(),
    };
});
//# sourceMappingURL=dashboard.js.map