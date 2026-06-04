"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPremiumRequestCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
exports.onPremiumRequestCreated = (0, firestore_1.onDocumentCreated)('premium_requests/{requestId}', (event) => {
    const data = event.data?.data();
    console.log('onPremiumRequestCreated', {
        requestId: event.params.requestId,
        uid: data?.['uid'],
        planType: data?.['planType'],
        status: data?.['status'],
    });
});
//# sourceMappingURL=triggers.js.map