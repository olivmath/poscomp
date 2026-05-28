import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sm2Update } from '../utils/sm2'
import type { SrsCard, SimuladoResult, AnswerRecord } from '../types'

// ── Firebase mocks ────────────────────────────────────────────────────────────

vi.mock('../firebase', () => ({ db: {} }))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockSetDoc = vi.fn().mockResolvedValue(undefined)
const mockGetDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, ...segments: string[]) => segments.join('/')),
  doc: vi.fn((_db: unknown, ...segments: string[]) => segments.join('/')),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  },
}))

import { useAuth } from '../hooks/useAuth'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSrs } from '../hooks/useSrs'

const mockUser = { uid: 'user-test' }

function makeEmptySnap() {
  return { docs: [] }
}

function makeSnap(cards: SrsCard[]) {
  return {
    docs: cards.map((c) => ({
      id: c.questionId,
      data: () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { questionId: _qid, ...rest } = c
        return rest
      },
    })),
  }
}

function makeCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    questionId: 'q-1',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    dueDate: { seconds: 0, nanoseconds: 0 } as SrsCard['dueDate'],
    createdAt: { seconds: 0, nanoseconds: 0 } as SrsCard['createdAt'],
    lastConfidence: null,
    studied: false,
    simuladoCorrect: false,
    ...overrides,
  }
}

function makeResult(answers: Partial<AnswerRecord>[]): SimuladoResult {
  return {
    id: 'result-1',
    completedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as SimuladoResult['completedAt'],
    score: 0,
    totalQuestions: answers.length,
    timeSpentSeconds: 60,
    areaBreakdown: {} as SimuladoResult['areaBreakdown'],
    answers: answers.map((a, i) => ({
      questionId: a.questionId ?? `q-${i}`,
      selected: a.selected ?? null,
      correct: a.correct ?? false,
      skipped: a.skipped ?? false,
      confidence: a.confidence ?? null,
    })),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSrs — upsertFromResult (Bug 1: card creation rules)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: mockUser as never, loading: false })
    // Default: no existing cards
    mockGetDocs.mockResolvedValue(makeEmptySnap())
  })

  // GIVEN a correct answer with confidence='unsure' (user guessed right)
  // WHEN  upsertFromResult is called
  // THEN  a new SRS card is created for that question
  it('cria card quando correct=true e confidence=unsure', async () => {
    const result = makeResult([{ questionId: 'q-1', correct: true, confidence: 'unsure' }])

    const { result: hook } = renderHook(() => useSrs())
    await waitFor(() => expect(hook.current.loading).toBe(false))

    await act(async () => {
      await hook.current.upsertFromResult(result)
    })

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    const written = mockSetDoc.mock.calls[0][1]
    expect(written.lastConfidence).toBe('unsure')
    expect(written.simuladoCorrect).toBe(true)
  })

  // GIVEN a correct answer with confidence='studying' (partially learned)
  // WHEN  upsertFromResult is called
  // THEN  a new SRS card is created for that question
  it('cria card quando correct=true e confidence=studying', async () => {
    const result = makeResult([{ questionId: 'q-2', correct: true, confidence: 'studying' }])

    const { result: hook } = renderHook(() => useSrs())
    await waitFor(() => expect(hook.current.loading).toBe(false))

    await act(async () => {
      await hook.current.upsertFromResult(result)
    })

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    const written = mockSetDoc.mock.calls[0][1]
    expect(written.lastConfidence).toBe('studying')
    expect(written.simuladoCorrect).toBe(true)
  })

  // GIVEN a correct answer with confidence='should_know' (confirmed domain)
  // WHEN  upsertFromResult is called
  // THEN  a new SRS card is created for that question
  it('cria card quando correct=true e confidence=should_know', async () => {
    const result = makeResult([{ questionId: 'q-3', correct: true, confidence: 'should_know' }])

    const { result: hook } = renderHook(() => useSrs())
    await waitFor(() => expect(hook.current.loading).toBe(false))

    await act(async () => {
      await hook.current.upsertFromResult(result)
    })

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    const written = mockSetDoc.mock.calls[0][1]
    expect(written.lastConfidence).toBe('should_know')
  })

  // GIVEN a correct answer with confidence=null (question was skipped)
  // WHEN  upsertFromResult is called
  // THEN  no SRS card is created
  it('NÃO cria card quando correct=true e confidence=null', async () => {
    const result = makeResult([{ questionId: 'q-4', correct: true, confidence: null }])

    const { result: hook } = renderHook(() => useSrs())
    await waitFor(() => expect(hook.current.loading).toBe(false))

    await act(async () => {
      await hook.current.upsertFromResult(result)
    })

    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  // GIVEN an incorrect answer (original behavior)
  // WHEN  upsertFromResult is called
  // THEN  a SRS card is created regardless of confidence
  it('cria card quando correct=false (comportamento original mantido)', async () => {
    const result = makeResult([{ questionId: 'q-5', correct: false, confidence: 'should_know' }])

    const { result: hook } = renderHook(() => useSrs())
    await waitFor(() => expect(hook.current.loading).toBe(false))

    await act(async () => {
      await hook.current.upsertFromResult(result)
    })

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    const written = mockSetDoc.mock.calls[0][1]
    expect(written.simuladoCorrect).toBe(false)
  })

  // GIVEN an existing card for a question that was answered incorrectly again
  // WHEN  upsertFromResult is called
  // THEN  the existing card is updated (not a new one created)
  it('atualiza card existente quando correct=false e card já existe', async () => {
    const existing = makeCard({ questionId: 'q-6', repetitions: 2, interval: 6 })
    mockGetDocs
      .mockResolvedValueOnce(makeSnap([existing])) // for upsertFromResult read
      .mockResolvedValueOnce(makeEmptySnap())       // for loadPendingCards after

    const result = makeResult([{ questionId: 'q-6', correct: false, confidence: 'studying' }])

    const { result: hook } = renderHook(() => useSrs())
    await waitFor(() => expect(hook.current.loading).toBe(false))

    await act(async () => {
      await hook.current.upsertFromResult(result)
    })

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    // Updated card — repetitions reset to 0 on grade < 3
    const written = mockSetDoc.mock.calls[0][1]
    expect(written.repetitions).toBe(0)
  })
})

describe('sm2Update — Bug 3: dueDate disponível hoje ao errar', () => {
  // GIVEN a card with any state and grade < 3 (wrong answer)
  // WHEN  sm2Update is called
  // THEN  dueDate.seconds <= now.seconds (card available today, not tomorrow)
  it('grade < 3 retorna dueDate com seconds <= now.seconds', () => {
    const card = makeCard({ repetitions: 2, interval: 6 })
    const now = Math.floor(Date.now() / 1000)
    const result = sm2Update(card, 1)
    expect(result.dueDate.seconds).toBeLessThanOrEqual(now + 1) // +1s tolerance
  })

  // GIVEN a card with grade < 3
  // WHEN  sm2Update is called
  // THEN  interval is still 1 (SM-2 reset behavior preserved)
  it('grade < 3 mantém interval=1 e repetitions=0', () => {
    const card = makeCard({ repetitions: 3, interval: 12 })
    const result = sm2Update(card, 1)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })
})
