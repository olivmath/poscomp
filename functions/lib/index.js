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
exports.reviewCard = exports.getPendingCards = exports.finishSimulado = exports.getSimuladoQuestions = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.db = admin.firestore();
var getSimuladoQuestions_1 = require("./getSimuladoQuestions");
Object.defineProperty(exports, "getSimuladoQuestions", { enumerable: true, get: function () { return getSimuladoQuestions_1.getSimuladoQuestions; } });
var finishSimulado_1 = require("./finishSimulado");
Object.defineProperty(exports, "finishSimulado", { enumerable: true, get: function () { return finishSimulado_1.finishSimulado; } });
var getPendingCards_1 = require("./getPendingCards");
Object.defineProperty(exports, "getPendingCards", { enumerable: true, get: function () { return getPendingCards_1.getPendingCards; } });
var reviewCard_1 = require("./reviewCard");
Object.defineProperty(exports, "reviewCard", { enumerable: true, get: function () { return reviewCard_1.reviewCard; } });
//# sourceMappingURL=index.js.map