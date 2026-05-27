import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useResults } from '../hooks/useResults'

// ── Firebase mocks ────────────────────────────────────────────────────────────

vi.mock('../firebase', () => ({ db: {} }))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
}))

import { useAuth } from '../hooks/useAuth'
import { getDocs } from 'firebase/firestore'

const mockUser = { uid: 'user-123' }

function makeSnap(docs: object[]) {
  return {
    docs: docs.map((data) => ({
      id: 'doc-id',
      data: () => data,
    })),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sem usuário → loading=false, sem erro, sem dados', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false })

    const { result } = renderHook(() => useResults())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.results).toEqual([])
    expect(result.current.analytics).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('usuário autenticado + sem resultados → estado vazio (não erro)', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser as never, loading: false })
    vi.mocked(getDocs).mockResolvedValue(makeSnap([]) as never)

    const { result } = renderHook(() => useResults())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.results).toHaveLength(0)
    expect(result.current.analytics).toBeNull()  // vazio = null, não erro
    expect(result.current.error).toBeNull()       // sem erro
  })

  it('usuário autenticado + com resultados → analytics calculado', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser as never, loading: false })
    vi.mocked(getDocs).mockResolvedValue(makeSnap([
      {
        score: 8,
        totalQuestions: 10,
        timeSpentSeconds: 300,
        completedAt: { toDate: () => new Date('2024-01-15') },
        areaBreakdown: {
          Matemática:   { correct: 2, total: 2 },
          Algoritmos:   { correct: 2, total: 2 },
          Lógica:       { correct: 1, total: 2 },
          'Banco de Dados': { correct: 2, total: 2 },
          Redes:        { correct: 1, total: 2 },
        },
      },
    ]) as never)

    const { result } = renderHook(() => useResults())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.results).toHaveLength(1)
    expect(result.current.analytics).not.toBeNull()
    expect(result.current.analytics?.totalSimulados).toBe(1)
    expect(result.current.analytics?.overallAccuracy).toBe(80)
    expect(result.current.error).toBeNull()
  })

  it('erro do Firestore (ex: permission-denied) → exibe mensagem de erro', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser as never, loading: false })
    vi.mocked(getDocs).mockRejectedValue(new Error('permission-denied'))

    const { result } = renderHook(() => useResults())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Erro ao carregar resultados. Verifique sua conexão.')
    expect(result.current.results).toHaveLength(0)
    expect(result.current.analytics).toBeNull()
  })
})
