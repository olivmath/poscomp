import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingModal } from './LoadingModal'

describe('LoadingModal', () => {
  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza com label "Carregando..."
  // THEN:  exibe o label
  test('renderiza com props open=true e label visível', () => {
    render(<LoadingModal open={true} label="Carregando..." />)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza com label texto
  // THEN:  label é encontrado via screen.getByText
  test('exibe label corretamente via screen.getByText', () => {
    render(<LoadingModal open={true} label="Salvando dados..." />)

    expect(screen.getByText('Salvando dados...')).toBeInTheDocument()
  })

  // GIVEN: LoadingModal com open={false}
  // WHEN:  componente renderiza
  // THEN:  nada é renderizado (null)
  test('não renderiza quando open=false', () => {
    const { container } = render(<LoadingModal open={false} label="Carregando..." />)

    expect(container.firstChild).toBeNull()
  })

  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza
  // THEN:  screen.getByRole encontra o progressdialog
  test('renderiza com role="progressdialog"', () => {
    render(<LoadingModal open={true} label="Carregando..." />)

    const dialog = screen.getByRole('progressdialog')
    expect(dialog).toBeInTheDocument()
  })

  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza
  // THEN:  aria-label é setado corretamente
  test('tem aria-label correto para acessibilidade', () => {
    render(<LoadingModal open={true} label="Carregando..." />)

    const dialog = screen.getByRole('progressdialog')
    expect(dialog).toHaveAttribute('aria-label', 'Carregando...')
  })

  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza
  // THEN:  aria-live="polite" é setado
  test('tem aria-live="polite" para atualizações dinâmicas', () => {
    render(<LoadingModal open={true} label="Carregando..." />)

    const dialog = screen.getByRole('progressdialog')
    expect(dialog).toHaveAttribute('aria-live', 'polite')
  })

  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza com label diferente
  // THEN:  screen.getByRole encontra e retorna elemento correto
  test('role="progressdialog" é encontrado por screen.getByRole', () => {
    render(<LoadingModal open={true} label="Teste" />)

    const dialog = screen.getByRole('progressdialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-label', 'Teste')
  })

  // GIVEN: LoadingModal com open={true}
  // WHEN:  componente renderiza
  // THEN:  label é renderizado
  test('renderiza label em um parágrafo', () => {
    render(<LoadingModal open={true} label="Carregando..." />)

    const labelText = screen.getByText('Carregando...')
    expect(labelText).toBeInTheDocument()
    expect(labelText.tagName).toBe('P')
  })
})
