import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// --- mocks ---
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

import { AppBarBack } from './AppBarBack'

describe('AppBarBack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // GIVEN: AppBarBack com title="Detalhes"
  // WHEN:  componente renderiza
  // THEN:  exibe o título passado via prop
  it('renderiza o título passado via prop', () => {
    render(<AppBarBack title="Detalhes" />)
    expect(screen.getByText('Detalhes')).toBeInTheDocument()
  })

  // GIVEN: AppBarBack com onBack fornecido
  // WHEN:  usuário clica no botão de voltar
  // THEN:  chama onBack
  it('clica no botão de voltar → chama onBack se fornecido', () => {
    const onBack = vi.fn()
    render(<AppBarBack title="Detalhes" onBack={onBack} />)

    const backButton = screen.getByRole('button', { name: /voltar/i })
    fireEvent.click(backButton)

    expect(onBack).toHaveBeenCalledOnce()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // GIVEN: AppBarBack sem onBack
  // WHEN:  usuário clica no botão de voltar
  // THEN:  chama navigate(-1)
  it('clica no botão de voltar → chama navigate(-1) se onBack não fornecido', () => {
    render(<AppBarBack title="Detalhes" />)

    const backButton = screen.getByRole('button', { name: /voltar/i })
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  // GIVEN: AppBarBack renderizado
  // WHEN:  componente renderiza
  // THEN:  botão tem aria-label para acessibilidade
  it('botão de voltar tem aria-label para acessibilidade', () => {
    render(<AppBarBack title="Detalhes" />)

    const backButton = screen.getByRole('button', { name: /voltar/i })
    expect(backButton).toHaveAttribute('aria-label')
  })

  // GIVEN: AppBarBack renderizado
  // WHEN:  componente renderiza
  // THEN:  é sticky no topo (position: sticky)
  it('é sticky no topo', () => {
    const { container } = render(<AppBarBack title="Detalhes" />)

    const sticky = container.querySelector('[style*="sticky"]')
    expect(sticky).toBeInTheDocument()
  })

  // GIVEN: AppBarBack com onBack e title="Simulado"
  // WHEN:  usuário clica no botão de voltar
  // THEN:  onBack é chamado, não navigate
  it('prefere onBack sobre navigate(-1) quando ambos disponíveis', () => {
    const onBack = vi.fn()
    render(<AppBarBack title="Simulado" onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))

    expect(onBack).toHaveBeenCalledOnce()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
