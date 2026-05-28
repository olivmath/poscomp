import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSimulado } from '../hooks/useSimulado'
import type { SimuladoConfig } from '../types'

// ── Firebase mocks ────────────────────────────────────────────────────────────

vi.mock('../firebase', () => ({ db: {}, functions: {} }))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  },
}))

const mockCallGetSimuladoQuestions = vi.fn()
const mockCallFinishSimulado = vi.fn()

vi.mock('../hooks/useFunctions', () => ({
  callGetSimuladoQuestions: (...args: unknown[]) => mockCallGetSimuladoQuestions(...args),
  callFinishSimulado: (...args: unknown[]) => mockCallFinishSimulado(...args),
  callGetPendingCards: vi.fn().mockResolvedValue({ data: { cards: [] } }),
  callReviewCard: vi.fn().mockResolvedValue({ data: {} }),
}))

import { useAuth } from '../hooks/useAuth'
import { getDocs } from 'firebase/firestore'

const mockUser = { uid: 'user-123' }

const FAKE_QUESTIONS = Array.from({ length: 20 }, (_, i) => ({
  id: `q-${i}`,
  enunciado: `Questão ${i + 1}`,
  alternativas: { A: 'Op A', B: 'Op B', C: 'Op C', D: 'Op D', E: 'Op E' },
  resposta: 'A',
  ano: 2024,
  area: i < 10 ? 'Matemática' : 'Fundamentos da Computação',
  comentario: `Comentário da questão ${i + 1}`,
  requer_imagem: false,
}))

function makeSnap(docs: Record<string, unknown>[]) {
  return {
    empty: docs.length === 0,
    docs: docs.map((data) => ({
      id: data['id'] ?? 'id',
      data: () => data,
    })),
  }
}

function makeFinishOutput(questions: typeof FAKE_QUESTIONS, score = 0) {
  return {
    data: {
      resultId: 'result-id',
      score,
      totalQuestions: questions.length,
      timeSpentSeconds: 0,
      areaBreakdown: {},
      answers: questions.map((q) => ({
        questionId: q.id,
        selected: 'A' as const,
        correct: true,
        confidence: 'should_know' as const,
        question: {
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          resposta: q.resposta,
          comentario: q.comentario,
        },
      })),
    },
  }
}

const DEFAULT_CONFIG: SimuladoConfig = {
  areas: [],
  totalQuestions: 10,
  timerMode: 'per-question',
  secondsPerQuestion: 120,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSimulado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({ user: mockUser as never, loading: false })
    // getDocs chamado no mount (lastResult) → vazio por padrão
    vi.mocked(getDocs).mockResolvedValue(makeSnap([]) as never)
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS } })
    mockCallFinishSimulado.mockResolvedValue(makeFinishOutput(FAKE_QUESTIONS.slice(0, 10)))
    localStorage.clear()
  })

  it('estado inicial = idle, sem loading, sem erro', async () => {
    const { result } = renderHook(() => useSimulado())

    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.config).toEqual(DEFAULT_CONFIG)
  })

  it('goToConfig() muda estado para config', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    act(() => {
      result.current.goToConfig()
    })

    expect(result.current.state).toBe('config')
  })

  it('start() com function retornando lista vazia → erro "Nenhuma questão encontrada"', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValueOnce({ data: { questions: [] } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => {
      result.current.start(DEFAULT_CONFIG)
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Nenhuma questão encontrada. Execute o seed primeiro.')
    expect(result.current.state).toBe('idle')
  })

  it('start() com erro da function → erro de conexão', async () => {
    mockCallGetSimuladoQuestions.mockRejectedValueOnce(new Error('functions/internal'))

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => {
      result.current.start(DEFAULT_CONFIG)
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Erro ao carregar questões. Verifique sua conexão.')
    expect(result.current.state).toBe('idle')
  })

  it('start() com 10 questões → estado muda para running', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => {
      result.current.start(DEFAULT_CONFIG)
    })

    await waitFor(() => expect(result.current.state).toBe('running'))

    expect(result.current.questions).toHaveLength(20) // backend controls count
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('start() com timerMode = none → secondsLeft deve ser 0', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    const config: SimuladoConfig = { ...DEFAULT_CONFIG, timerMode: 'none' }

    await act(async () => {
      result.current.start(config)
    })

    await waitFor(() => expect(result.current.state).toBe('running'))

    expect(result.current.secondsLeft).toBe(0)
  })

  it('retry() volta para idle após finalizar', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    // Inicia simulado
    await act(async () => { result.current.start(DEFAULT_CONFIG) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    // Retry deve voltar a idle
    await act(async () => { result.current.retry() })

    expect(result.current.state).toBe('idle')
    expect(result.current.questions).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('skip() registra skipped=true e avança para próxima questão', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS.slice(0, 5) } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    expect(result.current.currentIndex).toBe(0)

    act(() => { result.current.skip() })

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.answers).toHaveLength(1)
    expect(result.current.answers[0].skipped).toBe(true)
    expect(result.current.answers[0].selected).toBeNull()
    expect(result.current.answers[0].correct).toBe(false)
    expect(result.current.answers[0].confidence).toBeNull()
  })

  it('skip() na última questão finaliza o simulado', async () => {
    const twoQuestions = FAKE_QUESTIONS.slice(0, 2)
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: twoQuestions } })
    mockCallFinishSimulado.mockResolvedValue(makeFinishOutput(twoQuestions, 0))

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    const config = { ...DEFAULT_CONFIG, timerMode: 'none' as const, totalQuestions: 2 }
    await act(async () => { result.current.start(config) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    // Pula as 2 questões
    await act(async () => { result.current.skip() })
    await act(async () => { result.current.skip() })

    await waitFor(() => expect(result.current.state).toBe('finished'))
    // score from backend mock = 0
    expect(result.current.result?.score).toBe(0)
  })

  it('resultado final contém snapshot das questões com comentário', async () => {
    const oneQuestion = FAKE_QUESTIONS.slice(0, 1)
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: oneQuestion } })
    mockCallFinishSimulado.mockResolvedValue(makeFinishOutput(oneQuestion, 1))

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, timerMode: 'none', totalQuestions: 1 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.select('A') })
    await act(async () => { result.current.next('should_know') })

    await waitFor(() => expect(result.current.state).toBe('finished'))
    expect(result.current.result?.questionReviews).toHaveLength(1)
    expect(result.current.result?.questionReviews?.[0]).toMatchObject({
      enunciado: expect.stringContaining('Questão'),
      comentario: expect.stringContaining('Comentário da questão'),
      resposta: 'A',
    })
  })

  it('next(confidence) registra a confiança corretamente', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS.slice(0, 5) } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.select('A') })
    act(() => { result.current.next('unsure') })

    expect(result.current.answers).toHaveLength(1)
    expect(result.current.answers[0].confidence).toBe('unsure')
    expect(result.current.answers[0].skipped).toBe(false)
    expect(result.current.answers[0].selected).toBe('A')
    expect(result.current.answers[0].correct).toBe(true)
    expect(result.current.currentIndex).toBe(1)
  })

  it('next("unsure") registra confidence=unsure', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS.slice(0, 5) } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.select('B') })
    act(() => { result.current.next('unsure') })

    expect(result.current.answers[0].confidence).toBe('unsure')
    expect(result.current.answers[0].skipped).toBe(false)
  })

  it('next("should_know") registra confidence=should_know', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS.slice(0, 5) } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.select('B') })
    act(() => { result.current.next('should_know') })

    expect(result.current.answers[0].confidence).toBe('should_know')
    expect(result.current.answers[0].skipped).toBe(false)
    expect(result.current.questionStatuses[0]).toBe('should_know')
  })

  it('questionStatuses reflete o estado de cada questão', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS.slice(0, 3) } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 3 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    // Q0 → não visitada
    expect(result.current.questionStatuses[0]).toBe('unvisited')

    // Pula Q0
    act(() => { result.current.skip() })
    expect(result.current.questionStatuses[0]).toBe('skipped')

    // Responde Q1 com should_know
    act(() => { result.current.select('A') })
    act(() => { result.current.next('should_know') })
    expect(result.current.questionStatuses[1]).toBe('should_know')
  })

  it('goToQuestion() navega para o índice correto', async () => {
    mockCallGetSimuladoQuestions.mockResolvedValue({ data: { questions: FAKE_QUESTIONS.slice(0, 5) } })

    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.goToQuestion(3) })
    expect(result.current.currentIndex).toBe(3)
  })
})
