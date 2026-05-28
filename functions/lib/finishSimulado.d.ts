import type { Area, Option, Confidence, AreaBreakdown, AnswerOutput } from './types';
export declare const finishSimulado: import("firebase-functions/https").CallableFunction<any, Promise<{
    resultId: string;
    score: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    areaBreakdown: Record<Area, AreaBreakdown>;
    answers: AnswerOutput[];
}>, unknown>;
export type { Option, Confidence };
//# sourceMappingURL=finishSimulado.d.ts.map