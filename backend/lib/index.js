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
exports.sendWeeklySimuladoReminder = exports.sendStreakReminder = exports.sendReviewReminder = exports.onPremiumRequestCreated = exports.deleteAnnouncement = exports.updateAnnouncement = exports.createAnnouncement = exports.deleteFlaggedQuestion = exports.resolveFlaggedQuestion = exports.getFlaggedQuestions = exports.deleteQuestion = exports.updateQuestion = exports.createQuestion = exports.grantPremiumAdmin = exports.resetUserSrs = exports.enableUser = exports.disableUser = exports.listUsers = exports.revokeAdminRole = exports.setAdminRole = exports.reviewPremiumRequest = exports.getAdminDashboard = exports.registerFcmToken = exports.reportQuestion = exports.deleteAllData = exports.submitPremiumRequest = exports.getPixConfig = exports.getPendingCount = exports.reviewCard = exports.getMateriaReviewStats = exports.getPendingCards = exports.getResult = exports.getHistorico = exports.finishSimulado = exports.getSimuladoQuestions = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
var getSimuladoQuestions_1 = require("./simulado/getSimuladoQuestions");
Object.defineProperty(exports, "getSimuladoQuestions", { enumerable: true, get: function () { return getSimuladoQuestions_1.getSimuladoQuestions; } });
var finishSimulado_1 = require("./simulado/finishSimulado");
Object.defineProperty(exports, "finishSimulado", { enumerable: true, get: function () { return finishSimulado_1.finishSimulado; } });
var getHistorico_1 = require("./historico/getHistorico");
Object.defineProperty(exports, "getHistorico", { enumerable: true, get: function () { return getHistorico_1.getHistorico; } });
var getResult_1 = require("./historico/getResult");
Object.defineProperty(exports, "getResult", { enumerable: true, get: function () { return getResult_1.getResult; } });
var getPendingCards_1 = require("./srs/getPendingCards");
Object.defineProperty(exports, "getPendingCards", { enumerable: true, get: function () { return getPendingCards_1.getPendingCards; } });
var getMateriaReviewStats_1 = require("./srs/getMateriaReviewStats");
Object.defineProperty(exports, "getMateriaReviewStats", { enumerable: true, get: function () { return getMateriaReviewStats_1.getMateriaReviewStats; } });
var reviewCard_1 = require("./srs/reviewCard");
Object.defineProperty(exports, "reviewCard", { enumerable: true, get: function () { return reviewCard_1.reviewCard; } });
var getPendingCount_1 = require("./srs/getPendingCount");
Object.defineProperty(exports, "getPendingCount", { enumerable: true, get: function () { return getPendingCount_1.getPendingCount; } });
var getPixConfig_1 = require("./billing/getPixConfig");
Object.defineProperty(exports, "getPixConfig", { enumerable: true, get: function () { return getPixConfig_1.getPixConfig; } });
var submitPremiumRequest_1 = require("./billing/submitPremiumRequest");
Object.defineProperty(exports, "submitPremiumRequest", { enumerable: true, get: function () { return submitPremiumRequest_1.submitPremiumRequest; } });
var deleteAllData_1 = require("./conta/deleteAllData");
Object.defineProperty(exports, "deleteAllData", { enumerable: true, get: function () { return deleteAllData_1.deleteAllData; } });
var reportQuestion_1 = require("./conta/reportQuestion");
Object.defineProperty(exports, "reportQuestion", { enumerable: true, get: function () { return reportQuestion_1.reportQuestion; } });
var registerFcmToken_1 = require("./conta/registerFcmToken");
Object.defineProperty(exports, "registerFcmToken", { enumerable: true, get: function () { return registerFcmToken_1.registerFcmToken; } });
var dashboard_1 = require("./admin/dashboard");
Object.defineProperty(exports, "getAdminDashboard", { enumerable: true, get: function () { return dashboard_1.getAdminDashboard; } });
var premium_1 = require("./admin/premium");
Object.defineProperty(exports, "reviewPremiumRequest", { enumerable: true, get: function () { return premium_1.reviewPremiumRequest; } });
var users_1 = require("./admin/users");
Object.defineProperty(exports, "setAdminRole", { enumerable: true, get: function () { return users_1.setAdminRole; } });
Object.defineProperty(exports, "revokeAdminRole", { enumerable: true, get: function () { return users_1.revokeAdminRole; } });
Object.defineProperty(exports, "listUsers", { enumerable: true, get: function () { return users_1.listUsers; } });
Object.defineProperty(exports, "disableUser", { enumerable: true, get: function () { return users_1.disableUser; } });
Object.defineProperty(exports, "enableUser", { enumerable: true, get: function () { return users_1.enableUser; } });
Object.defineProperty(exports, "resetUserSrs", { enumerable: true, get: function () { return users_1.resetUserSrs; } });
Object.defineProperty(exports, "grantPremiumAdmin", { enumerable: true, get: function () { return users_1.grantPremiumAdmin; } });
var questions_1 = require("./admin/questions");
Object.defineProperty(exports, "createQuestion", { enumerable: true, get: function () { return questions_1.createQuestion; } });
Object.defineProperty(exports, "updateQuestion", { enumerable: true, get: function () { return questions_1.updateQuestion; } });
Object.defineProperty(exports, "deleteQuestion", { enumerable: true, get: function () { return questions_1.deleteQuestion; } });
var flags_1 = require("./admin/flags");
Object.defineProperty(exports, "getFlaggedQuestions", { enumerable: true, get: function () { return flags_1.getFlaggedQuestions; } });
Object.defineProperty(exports, "resolveFlaggedQuestion", { enumerable: true, get: function () { return flags_1.resolveFlaggedQuestion; } });
Object.defineProperty(exports, "deleteFlaggedQuestion", { enumerable: true, get: function () { return flags_1.deleteFlaggedQuestion; } });
var announcements_1 = require("./admin/announcements");
Object.defineProperty(exports, "createAnnouncement", { enumerable: true, get: function () { return announcements_1.createAnnouncement; } });
Object.defineProperty(exports, "updateAnnouncement", { enumerable: true, get: function () { return announcements_1.updateAnnouncement; } });
Object.defineProperty(exports, "deleteAnnouncement", { enumerable: true, get: function () { return announcements_1.deleteAnnouncement; } });
var triggers_1 = require("./background/triggers");
Object.defineProperty(exports, "onPremiumRequestCreated", { enumerable: true, get: function () { return triggers_1.onPremiumRequestCreated; } });
var notifications_1 = require("./background/notifications");
Object.defineProperty(exports, "sendReviewReminder", { enumerable: true, get: function () { return notifications_1.sendReviewReminder; } });
Object.defineProperty(exports, "sendStreakReminder", { enumerable: true, get: function () { return notifications_1.sendStreakReminder; } });
Object.defineProperty(exports, "sendWeeklySimuladoReminder", { enumerable: true, get: function () { return notifications_1.sendWeeklySimuladoReminder; } });
//# sourceMappingURL=index.js.map