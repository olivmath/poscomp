import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSimulado } from './useSimulado'
import * as useFunctions from './useFunctions'
import { useAuth } from './useAuth'
import { SnackbarProvider } from '../components/SnackbarProvider'
import type { User } from 'firebase/auth'

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./useFunctions', () => ({
  callGetSimuladoQuestions: vi.fn(),
  callFinishSimulado: vi.fn(),
}))

const mockAuth = {
  user: { uid: 'test-uid' } as User,
  loading: false,
  isPremium: false,
  premiumStatus: 'free' as const,
  premiumExpiresAt: null,
  profileLoading: false
}

function SnackbarWrapper({ children }: { children: React.ReactNode }) {
  return <SnackbarProvider>{children}</SnackbarProvider>
}

describe('useSimulado', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(mockAuth)
    vi.mocked(useFunctions.callGetSimuladoQuestions).mockClear()
    vi.mocked(useFunctions.callFinishSimulado).mockClear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  test('loading é false inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.loading).toBe(false)
  })

  test('estado inicial é idle', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.state).toBe('idle')
  })

  test('result é null inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.result).toBeNull()
  })

  test('questions é empty array inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.questions).toEqual([])
  })

  test('carrega config do localStorage', () => {
    const savedConfig = {
      areas: ['Fundamentos'],
      totalQuestions: 20,
      timerMode: 'per-question' as const,
      secondsPerQuestion: 120,
    }
    localStorage.setItem('poscomp-simulado-config', JSON.stringify(savedConfig))
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.config).toEqual(savedConfig)
  })

  test('goToConfig() muda estado para config', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    act(() => {
      result.current.goToConfig()
    })
    expect(result.current.state).toBe('config')
  })

  test('select() atualiza selectedOption', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    act(() => {
      result.current.select('B')
    })
    expect(result.current.selectedOption).toBe('B')
  })

  test('retry() reseta estado para idle', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    act(() => {
      result.current.goToConfig()
    })
    expect(result.current.state).toBe('config')
    act(() => {
      result.current.retry()
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.questions.length).toBe(0)
    expect(result.current.selectedOption).toBeNull()
  })

  test('calcula questionStatuses corretamente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(Array.isArray(result.current.questionStatuses)).toBe(true)
    expect(result.current.questionStatuses.length).toBe(0)
  })

  test('currentIndex é 0 inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.currentIndex).toBe(0)
  })

  test('answers é empty array inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.answers).toEqual([])
  })

  test('error é null inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.error).toBeNull()
  })

  test('secondsLeft é 0 inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.secondsLeft).toBe(0)
  })

  test('selectedOption é null inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.selectedOption).toBeNull()
  })

  test('lastResult é null inicialmente', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.lastResult).toBeNull()
  })

  test('config tem DEFAULT_CONFIG quando sem localStorage', () => {
    const { result } = renderHook(() => useSimulado(), { wrapper: SnackbarWrapper })
    expect(result.current.config.areas).toBeDefined()
    expect(result.current.config.totalQuestions).toBe(10)
    expect(result.current.config.timerMode).toBe('per-question')
    expect(result.current.config.secondsPerQuestion).toBe(120)
  })
})
