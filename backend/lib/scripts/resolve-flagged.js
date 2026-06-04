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
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
async function main() {
    const id = process.argv[2];
    if (!id) {
        console.error('Usage: npx tsx scripts/resolve-flagged.ts <id>');
        process.exit(1);
    }
    const db = admin.firestore();
    const ref = db.doc(`flagged_questions/${id}`);
    const snap = await ref.get();
    if (!snap.exists) {
        console.error('Not found:', id);
        process.exit(1);
    }
    await ref.update({ resolved: true, resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`✓ Resolved flagged question ${id}`);
    process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=resolve-flagged.js.map