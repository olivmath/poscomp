import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// --- mocks ---
const mockNavigate = vi.fn()
let mockPendingCount = 0
let mockIsMobile = true

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}))

vi.mock('../hooks/usePendingCount', () => ({
  usePendingCount: () => mockPendingCount,
}))

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPendingCount = 0
    mockIsMobile = true
  })

  // GIVEN: BottomNav em mobile (useIsMobile = true)
  // WHEN:  componente renderiza
  // THEN:  renderiza os itens Home, Revisão e Histórico
  it('renderiza os 3 nav items principais (Home, Revisão, Histórico)', () => {
    render(<BottomNav />)

    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Revisão')).toBeInTheDocument()
    expect(screen.getByLabelText('Histórico')).toBeInTheDocument()
  })

  // GIVEN: BottomNav em mobile
  // WHEN:  usuário clica em "Revisão"
  // THEN:  chama navigate('/revisao')
  it('clicar em "Revisão" chama navigate("/revisao")', () => {
    render(<BottomNav />)

    fireEvent.click(screen.getByLabelText('Revisão'))

    expect(mockNavigate).toHaveBeenCalledWith('/revisao')
  })

  // GIVEN: pathname='/' (Home ativo)
  // WHEN:  componente renderiza
  // THEN:  item Home está marcado como ativo (aria-current="page")
  it('item "Home" está ativo quando pathname="/"', () => {
    render(<BottomNav />)

    expect(screen.getByLabelText('Home')).toHaveAttribute('aria-current', 'page')
  })

  // GIVEN: usePendingCount retorna > 0
  // WHEN:  componente renderiza
  // THEN:  badge aparece no item Revisão
  it('badge aparece no item Revisão quando pendingCount > 0', () => {
    mockPendingCount = 5
    render(<BottomNav />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  // GIVEN: useIsMobile retorna false (desktop)
  // WHEN:  componente renderiza
  // THEN:  não renderiza nada
  it('não renderiza nada quando useIsMobile retorna false', () => {
    mockIsMobile = false
    const { container } = render(<BottomNav />)

    expect(container.firstChild).toBeNull()
  })
})
