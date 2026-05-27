import { Timestamp } from 'firebase/firestore'
import type { SrsCard, Grade, Confidence } from '../types'

export function sm2Update(card: SrsCard, grade: Grade): Omit<SrsCard, 'questionId' | 'createdAt'> {
  const ef = calcEaseFactor(card.easeFactor, grade)

  if (grade < 3) {
    return {
  easeFactor: ef,
  interval: 1,
  repetitions: 0,
  dueDate: Timestamp.fromDate(addDays(1)),
  lastConfidence: card.lastConfidence,
  studied: card.studied,
  simuladoCorrect: card.simuladoCorrect,
}
  }

  const interval = calcInterval(card.repetitions, card.interval, ef)

  return {
  easeFactor: ef,
  interval,
  repetitions: card.repetitions + 1,
  dueDate: Timestamp.fromDate(addDays(interval)),
  lastConfidence: card.lastConfidence,
  studied: card.studied,
  simuladoCorrect: card.simuladoCorrect,
}
}

export function gradeFromResult(correct: boolean, confidence: Confidence): Grade {
  if (!correct) return 1
  if (confidence === 'certain') return 5
  return 3
}

///// AUX FUNCTIONS

function calcEaseFactor(current: number, grade: Grade): number {
  const next = current + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
  return Math.max(1.3, next)
}

function calcInterval(repetitions: number, prevInterval: number, ef: number): number {
  if (repetitions === 0) return 1
  if (repetitions === 1) return 6
  return Math.round(prevInterval * ef)
}

function addDays(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}
