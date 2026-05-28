import type { Timestamp } from 'firebase-admin/firestore';
export type Area = 'Matemática' | 'Fundamentos da Computação' | 'Tecnologia da Computação';
export type Option = 'A' | 'B' | 'C' | 'D' | 'E';
export type Confidence = 'unsure' | 'studying' | 'should_know';
export declare const VALID_AREAS: Area[];
export declare const VALID_OPTIONS: Option[];
export declare const VALID_CONFIDENCES: Confidence[];
export interface Question {
    id: string;
    ano: number;
    area: Area;
    enunciado: string;
    alternativas: Record<Option, string>;
    resposta: Option;
    comentario?: string;
}
export interface SrsCard {
    questionId: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    dueDate: Timestamp;
    createdAt: Timestamp;
    lastConfidence: Confidence | null;
    studied: boolean;
    simuladoCorrect: boolean;
}
export interface GetSimuladoQuestionsInput {
    areas: Area[];
    total: number;
}
export interface AnswerInput {
    questionId: string;
    selected: Option;
    confidence: Confidence;
}
export interface FinishSimuladoInput {
    answers: AnswerInput[];
    timeSpentSeconds: number;
}
export interface ReviewCardInput {
    questionId: string;
    studied: boolean;
}
export interface AreaBreakdown {
    correct: number;
    total: number;
}
export interface AnswerOutput {
    questionId: string;
    selected: Option;
    correct: boolean;
    confidence: Confidence;
    question: {
        enunciado: string;
        alternativas: Record<Option, string>;
        resposta: Option;
        comentario?: string;
    };
}
export interface FinishSimuladoOutput {
    resultId: string;
    score: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    areaBreakdown: Record<Area, AreaBreakdown>;
    answers: AnswerOutput[];
}
export interface PendingCardOutput {
    questionId: string;
    priority: 'P1' | 'P2' | 'P3';
    lastConfidence: Confidence;
    dueDate: string;
    repetitions: number;
    easeFactor: number;
    interval: number;
    question: {
        id: string;
        ano: number;
        area: Area;
        enunciado: string;
        alternativas: Record<Option, string>;
        resposta: Option;
        comentario?: string;
    };
}
export interface ReviewCardOutput {
    nextDueDays: number;
    nextDueDate: string;
    newInterval: number;
    newEaseFactor: number;
    newRepetitions: number;
}
//# sourceMappingURL=types.d.ts.map