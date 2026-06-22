import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// --- mocks ---
let mockMatches = true
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query === '(max-width: 767px)' ? mockMatches : false,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
}))

import { useIsMobile } from './useIsMobile'

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatches = true
  })

  // GIVEN: matchMedia retorna matches: true para (max-width: 767px)
  // WHEN:  hook é inicializado
  // THEN:  retorna true
  it('retorna true quando matchMedia retorna matches: true', () => {
    mockMatches = true
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  // GIVEN: matchMedia retorna matches: false para (max-width: 767px)
  // WHEN:  hook é inicializado
  // THEN:  retorna false
  it('retorna false quando matchMedia retorna matches: false', () => {
    mockMatches = false
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  // GIVEN: hook montado
  // WHEN:  componente monta
  // THEN:  registra listener no evento change
  it('registra listener no evento change ao montar', () => {
    renderHook(() => useIsMobile())
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  // GIVEN: hook montado
  // WHEN:  componente desmonta
  // THEN:  remove listener do evento change
  it('remove listener no evento change ao desmontar', () => {
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  // GIVEN: hook montado com matches: true
  // WHEN:  evento change é disparado com matches: false
  // THEN:  retorna false
  it('atualiza valor quando o evento change é disparado', () => {
    mockMatches = true
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    const changeHandler = mockAddEventListener.mock.calls[0][1] as (e: { matches: boolean }) => void

    act(() => {
      changeHandler({ matches: false })
    })

    expect(result.current).toBe(false)
  })
})
