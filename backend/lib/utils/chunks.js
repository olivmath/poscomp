"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkArray = chunkArray;
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size)
        chunks.push(arr.slice(i, i + size));
    return chunks;
}
//# sourceMappingURL=chunks.js.map