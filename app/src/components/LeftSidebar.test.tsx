import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// --- mocks ---
const mockNavigate = vi.fn()
let mockPendingCount = 0
let mockIsMobile = false

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

import { LeftSidebar } from './LeftSidebar'

describe('LeftSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPendingCount = 0
    mockIsMobile = false
  })

  // GIVEN: LeftSidebar em desktop (useIsMobile = false)
  // WHEN:  componente renderiza
  // THEN:  renderiza os 3 nav items (Home, Revisão, Histórico)
  it('renderiza os 3 nav items (Home, Revisão, Histórico)', () => {
    render(<LeftSidebar />)

    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Revisão')).toBeInTheDocument()
    expect(screen.getByLabelText('Histórico')).toBeInTheDocument()
  })

  // GIVEN: LeftSidebar em desktop
  // WHEN:  usuário clica em "Histórico"
  // THEN:  chama navigate('/historico')
  it('clicar em "Histórico" chama navigate("/historico")', () => {
    render(<LeftSidebar />)

    fireEvent.click(screen.getByLabelText('Histórico'))

    expect(mockNavigate).toHaveBeenCalledWith('/historico')
  })

  // GIVEN: pathname='/' (Home ativo)
  // WHEN:  componente renderiza
  // THEN:  item Home está marcado como ativo (aria-current="page")
  it('item "Home" está ativo quando pathname="/"', () => {
    render(<LeftSidebar />)

    expect(screen.getByLabelText('Home')).toHaveAttribute('aria-current', 'page')
  })

  // GIVEN: usePendingCount retorna > 0
  // WHEN:  componente renderiza
  // THEN:  badge aparece no item Revisão
  it('badge aparece no item Revisão quando pendingCount > 0', () => {
    mockPendingCount = 3
    render(<LeftSidebar />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  // GIVEN: useIsMobile retorna true (mobile)
  // WHEN:  componente renderiza
  // THEN:  não renderiza nada (sidebar é apenas para desktop)
  it('não renderiza nada quando useIsMobile retorna true', () => {
    mockIsMobile = true
    const { container } = render(<LeftSidebar />)

    expect(container.firstChild).toBeNull()
  })
})
