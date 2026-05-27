import { describe, it, expect, vi } from 'vitest'
import { sm2Update, gradeFromResult } from '../utils/sm2'
import type { SrsCard } from '../types'

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  },
}))

function makeCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    questionId: 'q-1',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    dueDate: { seconds: 0, nanoseconds: 0 } as SrsCard['dueDate'],
    createdAt: { seconds: 0, nanoseconds: 0 } as SrsCard['createdAt'],
    lastConfidence: null,
    ...overrides,
  }
}

describe('sm2Update', () => {
  // GIVEN a card with repetitions=2 and grade < 3 (blackout)
  // WHEN  sm2Update is called with grade 1
  // THEN  interval resets to 1 and repetitions resets to 0
  it('grade 1 reseta interval para 1 e repetitions para 0', () => {
    const card = makeCard({ repetitions: 2, interval: 6 })
    const result = sm2Update(card, 1)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  // GIVEN a fresh card with repetitions=0
  // WHEN  sm2Update is called with grade 3 (pass, unsure)
  // THEN  interval is 1 (first successful repetition)
  it('grade 3 com repetitions=0 → interval=1', () => {
    const card = makeCard({ repetitions: 0 })
    const result = sm2Update(card, 3)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  // GIVEN a card with repetitions=1 (one prior success)
  // WHEN  sm2Update is called with grade 3
  // THEN  interval jumps to 6 (SM-2 hardcoded second step)
  it('grade 3 com repetitions=1 → interval=6', () => {
    const card = makeCard({ repetitions: 1, interval: 1 })
    const result = sm2Update(card, 3)
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  // GIVEN a card with repetitions=2 and interval=6 and easeFactor=2.5
  // WHEN  sm2Update is called with grade 3
  // THEN  interval = round(6 * new_ef)
  it('grade 3 com repetitions=2 → interval = round(prev_interval * ef)', () => {
    const card = makeCard({ repetitions: 2, interval: 6, easeFactor: 2.5 })
    const result = sm2Update(card, 3)
    // ef = max(1.3, 2.5 + 0.1 - (5-3)*(0.08 + (5-3)*0.02)) = 2.5 + 0.1 - 2*(0.08+0.04) = 2.5 + 0.1 - 0.24 = 2.36
    const expectedEf = Math.max(1.3, 2.5 + 0.1 - 2 * (0.08 + 2 * 0.02))
    expect(result.interval).toBe(Math.round(6 * expectedEf))
  })

  // GIVEN a card with easeFactor=2.5
  // WHEN  sm2Update is called with grade 5 (perfect recall)
  // THEN  easeFactor increases above 2.5
  it('grade 5 aumenta easeFactor', () => {
    const card = makeCard({ easeFactor: 2.5 })
    const result = sm2Update(card, 5)
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  // GIVEN a card with easeFactor=1.3 (minimum) and grade 1 (worst response)
  // WHEN  sm2Update is called
  // THEN  easeFactor stays at 1.3 — never drops below floor
  it('easeFactor nunca fica abaixo de 1.3', () => {
    const card = makeCard({ easeFactor: 1.3 })
    const result = sm2Update(card, 1)
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })
})

describe('gradeFromResult', () => {
  // GIVEN an incorrect answer with any confidence
  // WHEN  gradeFromResult is called
  // THEN  returns grade 1 (blackout)
  it('resposta errada → grade 1', () => {
    expect(gradeFromResult(false, 'certain')).toBe(1)
    expect(gradeFromResult(false, 'unsure')).toBe(1)
    expect(gradeFromResult(false, null)).toBe(1)
  })

  // GIVEN a correct answer with confidence=certain
  // WHEN  gradeFromResult is called
  // THEN  returns grade 5 (perfect)
  it('correto + certain → grade 5', () => {
    expect(gradeFromResult(true, 'certain')).toBe(5)
  })

  // GIVEN a correct answer with confidence=unsure or null
  // WHEN  gradeFromResult is called
  // THEN  returns grade 3 (pass with hesitation)
  it('correto + unsure/null → grade 3', () => {
    expect(gradeFromResult(true, 'unsure')).toBe(3)
    expect(gradeFromResult(true, null)).toBe(3)
  })
})
