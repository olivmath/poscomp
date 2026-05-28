import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSimulado } from '../hooks/useSimulado'
import type { SimuladoConfig } from '../types'

// ── Firebase mocks ────────────────────────────────────────────────────────────

vi.mock('../firebase', () => ({ db: {} }))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
    now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  },
}))

vi.mock('../hooks/useSrs', () => ({
  useSrs: vi.fn(() => ({
    pendingCards: [],
    totalPending: 0,
    loading: false,
    upsertFromResult: vi.fn().mockResolvedValue(undefined),
    updateCard: vi.fn().mockResolvedValue(undefined),
  })),
}))

import { useAuth } from '../hooks/useAuth'
import { getDocs, addDoc } from 'firebase/firestore'

const mockUser = { uid: 'user-123' }

const FAKE_QUESTIONS: Record<string, unknown>[] = Array.from({ length: 20 }, (_, i) => ({
  id: `q-${i}`,
  text: `Questão ${i + 1}`,
  options: { A: 'Op A', B: 'Op B', C: 'Op C', D: 'Op D', E: 'Op E' },
  correctOption: 'A',
  area: i < 10 ? 'Matemática' : 'Algoritmos',
  difficulty: 'fácil',
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

  it('start() com coleção questions vazia → erro "Nenhuma questão encontrada"', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    // segunda chamada de getDocs (dentro de start()) → vazia
    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap([]) as never)

    await act(async () => {
      result.current.start(DEFAULT_CONFIG)
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Nenhuma questão encontrada. Execute o seed primeiro.')
    expect(result.current.state).toBe('idle')
  })

  it('start() com erro do Firestore → erro de conexão', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockRejectedValueOnce(new Error('permission-denied'))

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

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    await act(async () => {
      result.current.start(DEFAULT_CONFIG)
    })

    await waitFor(() => expect(result.current.state).toBe('running'))

    expect(result.current.questions).toHaveLength(10)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('start() com filtro por área → retorna apenas questões da área', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    const config: SimuladoConfig = { ...DEFAULT_CONFIG, areas: ['Matemática'] }

    await act(async () => {
      result.current.start(config)
    })

    await waitFor(() => expect(result.current.state).toBe('running'))

    expect(result.current.questions.every(q => q.area === 'Matemática')).toBe(true)
  })

  it('start() com totalQuestions = 5 → retorna 5 questões', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    const config: SimuladoConfig = { ...DEFAULT_CONFIG, totalQuestions: 5 }

    await act(async () => {
      result.current.start(config)
    })

    await waitFor(() => expect(result.current.state).toBe('running'))

    expect(result.current.questions).toHaveLength(5)
  })

  it('start() com timerMode = none → secondsLeft deve ser 0', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

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

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)
    vi.mocked(addDoc).mockResolvedValue({ id: 'result-id' } as never)

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
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

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
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)
    vi.mocked(addDoc).mockResolvedValue({ id: 'result-id' } as never)

    const config = { ...DEFAULT_CONFIG, timerMode: 'none' as const, totalQuestions: 2 }
    await act(async () => { result.current.start(config) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    // Pula as 2 questões
    await act(async () => { result.current.skip() })
    await act(async () => { result.current.skip() })

    await waitFor(() => expect(result.current.state).toBe('finished'))
    expect(result.current.result?.score).toBe(0)
  })

  it('next(confidence) registra a confiança corretamente', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    // Seleciona opção A (correctOption)
    act(() => { result.current.select('A') })
    act(() => { result.current.next('certain') })

    expect(result.current.answers).toHaveLength(1)
    expect(result.current.answers[0].confidence).toBe('certain')
    expect(result.current.answers[0].skipped).toBe(false)
    expect(result.current.answers[0].selected).toBe('A')
    expect(result.current.answers[0].correct).toBe(true)
    expect(result.current.currentIndex).toBe(1)
  })

  it('next("unsure") registra confidence=unsure', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.select('B') })
    act(() => { result.current.next('unsure') })

    expect(result.current.answers[0].confidence).toBe('unsure')
    expect(result.current.answers[0].skipped).toBe(false)
  })

  it('next("should_know") registra confidence=should_know', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.select('B') })
    act(() => { result.current.next('should_know') })

    expect(result.current.answers[0].confidence).toBe('should_know')
    expect(result.current.answers[0].skipped).toBe(false)
    expect(result.current.questionStatuses[0]).toBe('should_know')
  })

  it('questionStatuses reflete o estado de cada questão', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 3 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    // Q0 → não visitada
    expect(result.current.questionStatuses[0]).toBe('unvisited')

    // Pula Q0
    act(() => { result.current.skip() })
    expect(result.current.questionStatuses[0]).toBe('skipped')

    // Responde Q1 com certeza
    act(() => { result.current.select('A') })
    act(() => { result.current.next('certain') })
    expect(result.current.questionStatuses[1]).toBe('certain')
  })

  it('goToQuestion() navega para o índice correto', async () => {
    const { result } = renderHook(() => useSimulado())
    await waitFor(() => expect(result.current.state).toBe('idle'))

    vi.mocked(getDocs).mockResolvedValueOnce(makeSnap(FAKE_QUESTIONS) as never)

    await act(async () => { result.current.start({ ...DEFAULT_CONFIG, totalQuestions: 5 }) })
    await waitFor(() => expect(result.current.state).toBe('running'))

    act(() => { result.current.goToQuestion(3) })
    expect(result.current.currentIndex).toBe(3)
  })
})
