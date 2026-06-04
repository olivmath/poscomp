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
exports.getHistorico = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
exports.getHistorico = (0, https_1.onCall)(async (request) => {
    const auth = await (0, auth_1.requirePremium)(request);
    console.log('getHistorico started', { uid: auth.uid });
    const db = admin.firestore();
    let snap;
    try {
        snap = await db
            .collection(`users/${auth.uid}/results`)
            .orderBy('completedAt', 'desc')
            .get();
    }
    catch (e) {
        throw new https_1.HttpsError('internal', 'Firestore error');
    }
    const results = snap.docs.map((d) => {
        const data = d.data();
        return {
            resultId: d.id,
            score: data['score'],
            totalQuestions: data['totalQuestions'],
            completedAt: data['completedAt']?.toDate().toISOString() ?? new Date().toISOString(),
            materiaBreakdown: data['materiaBreakdown'],
        };
    });
    // Trend: delta % vs anterior
    let trend = null;
    if (results.length >= 2) {
        const latest = results[0].score / results[0].totalQuestions;
        const prev = results[1].score / results[1].totalQuestions;
        trend = Math.round((latest - prev) * 100);
    }
    // byMateria aggregate
    const byMateria = {};
    for (const r of results) {
        for (const [m, stats] of Object.entries(r.materiaBreakdown)) {
            if (!byMateria[m])
                byMateria[m] = { correct: 0, total: 0 };
            byMateria[m].correct += stats.correct;
            byMateria[m].total += stats.total;
        }
    }
    // Streak: consecutive days up to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeDatesSet = new Set(results.map((r) => r.completedAt.split('T')[0]));
    let streak = 0;
    const check = new Date(today);
    while (true) {
        const dateStr = check.toISOString().split('T')[0];
        if (activeDatesSet.has(dateStr)) {
            streak++;
            check.setDate(check.getDate() - 1);
        }
        else {
            break;
        }
    }
    // activeDaysThisWeek
    const activeDaysThisWeek = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (activeDatesSet.has(ds))
            activeDaysThisWeek.push(ds);
    }
    console.log('getHistorico finished', { uid: auth.uid, count: results.length });
    return { results, trend, byMateria, streak, activeDaysThisWeek };
});
//# sourceMappingURL=getHistorico.js.map