"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySm2 = applySm2;
function applySm2(card, studied) {
    let { interval, easeFactor, repetitions } = card;
    if (studied) {
        interval = Math.min(Math.round(interval * easeFactor), 365);
        easeFactor = easeFactor + 0.1;
        repetitions = repetitions + 1;
    }
    else {
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        repetitions = 0;
    }
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + interval);
    return { interval, easeFactor, repetitions, nextDueDate };
}
//# sourceMappingURL=sm2.js.map