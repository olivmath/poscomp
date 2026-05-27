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
  serverTimestamp: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
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
})
