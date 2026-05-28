import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sm2Update } from '../utils/sm2'
import type { SrsCard } from '../types'

// ── Firebase mocks ────────────────────────────────────────────────────────────

vi.mock('../firebase', () => ({ db: {}, functions: {} }))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockCallGetPendingCards = vi.fn()

vi.mock('../hooks/useFunctions', () => ({
  callGetPendingCards: (...args: unknown[]) => mockCallGetPendingCards(...args),
  callGetSimuladoQuestions: vi.fn(),
  callFinishSimulado: vi.fn(),
  callReviewCard: vi.fn(),
}))

import { useAuth } from '../hooks/useAuth'
import { renderHook, waitFor } from '@testing-library/react'
import { useSrs } from '../hooks/useSrs'

const mockUser = { uid: 'user-test' }

function makeCard(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    questionId: 1,
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSrs — totalPending via callGetPendingCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: mockUser as never, loading: false })
    mockCallGetPendingCards.mockResolvedValue({ data: { cards: [] } })
  })

  // GIVEN a user is authenticated and backend returns 0 pending cards
  // WHEN  useSrs mounts
  // THEN  totalPending = 0 and loading = false
  it('totalPending = 0 quando backend retorna lista vazia', async () => {
    const { result } = renderHook(() => useSrs())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.totalPending).toBe(0)
    expect(result.current.pendingCards).toEqual([])
  })

  // GIVEN backend returns 3 pending cards
  // WHEN  useSrs mounts
  // THEN  totalPending = 3
  it('totalPending reflete quantidade de cards retornados pelo backend', async () => {
    const cards = [makeCard({ questionId: 1 }), makeCard({ questionId: 2 }), makeCard({ questionId: 3 })]
    // PendingCardOutput shape (simplified for test)
    mockCallGetPendingCards.mockResolvedValue({
      data: {
        cards: cards.map((c) => ({
          questionId: c.questionId,
          priority: 'P1',
          lastConfidence: 'should_know',
          dueDate: new Date().toISOString(),
          repetitions: 0,
          easeFactor: 2.5,
          interval: 1,
          question: {
            id: c.questionId,
            ano: 2024,
            area: 'Matemática',
            enunciado: 'Enunciado',
            alternativas: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
            resposta: 'A',
          },
        })),
      },
    })

    const { result } = renderHook(() => useSrs())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.totalPending).toBe(3)
  })

  // GIVEN callGetPendingCards throws
  // WHEN  useSrs mounts
  // THEN  loading = false and totalPending = 0 (no crash)
  it('não crasha quando callGetPendingCards falha', async () => {
    mockCallGetPendingCards.mockRejectedValue(new Error('functions/internal'))

    const { result } = renderHook(() => useSrs())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.totalPending).toBe(0)
  })
})

describe('sm2Update — dueDate disponível hoje ao errar', () => {
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
