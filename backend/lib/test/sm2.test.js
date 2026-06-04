"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sm2_1 = require("../utils/sm2");
describe('applySm2', () => {
    const base = { interval: 1, easeFactor: 2.5, repetitions: 0 };
    it('increases interval on correct answer', () => {
        const result = (0, sm2_1.applySm2)(base, true);
        expect(result.interval).toBe(Math.min(Math.round(1 * 2.5), 365));
        expect(result.easeFactor).toBeCloseTo(2.6);
        expect(result.repetitions).toBe(1);
    });
    it('resets interval on wrong answer', () => {
        const result = (0, sm2_1.applySm2)({ interval: 10, easeFactor: 2.5, repetitions: 3 }, false);
        expect(result.interval).toBe(1);
        expect(result.easeFactor).toBeCloseTo(2.3);
        expect(result.repetitions).toBe(0);
    });
    it('does not go below 1.3 easeFactor', () => {
        const result = (0, sm2_1.applySm2)({ interval: 1, easeFactor: 1.3, repetitions: 0 }, false);
        expect(result.easeFactor).toBeCloseTo(1.3);
    });
    it('caps interval at 365 days', () => {
        const result = (0, sm2_1.applySm2)({ interval: 200, easeFactor: 3.0, repetitions: 10 }, true);
        expect(result.interval).toBeLessThanOrEqual(365);
    });
    it('sets nextDueDate in the future', () => {
        const result = (0, sm2_1.applySm2)(base, true);
        expect(result.nextDueDate.getTime()).toBeGreaterThan(Date.now());
    });
});
//# sourceMappingURL=sm2.test.js.map