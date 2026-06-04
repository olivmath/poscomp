"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chunks_1 = require("../utils/chunks");
describe('chunkArray', () => {
    it('splits array into chunks of given size', () => {
        const result = (0, chunks_1.chunkArray)([1, 2, 3, 4, 5], 2);
        expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
    it('returns single chunk when array smaller than size', () => {
        const result = (0, chunks_1.chunkArray)([1, 2], 10);
        expect(result).toEqual([[1, 2]]);
    });
    it('returns empty array for empty input', () => {
        expect((0, chunks_1.chunkArray)([], 5)).toEqual([]);
    });
});
//# sourceMappingURL=chunks.test.js.map