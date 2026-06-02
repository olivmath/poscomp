import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ReportIssueModal } from './ReportIssueModal'
import { SnackbarProvider } from '../SnackbarProvider'

const mockOnConfirm = vi.fn()
const mockOnCancel = vi.fn()

function renderWithSnackbar(component: React.ReactNode) {
  return render(<SnackbarProvider>{component}</SnackbarProvider>)
}

describe('ReportIssueModal', () => {
  beforeEach(() => {
    mockOnConfirm.mockClear()
    mockOnCancel.mockClear()
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  renderiza inicial
  // THEN:  form é exibido com input textarea
  test('renderiza form normal no estado inicial', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    expect(screen.getByPlaceholderText('Comentário (opcional)')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Enviar')).toBeInTheDocument()
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  clicar no botão Cancelar
  // THEN:  onCancel é chamado
  test('chama onCancel ao clicar em Cancelar', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    const cancelBtn = screen.getByText('Cancelar')
    act(() => {
      cancelBtn.click()
    })

    expect(mockOnCancel).toHaveBeenCalled()
  })

  // GIVEN: ReportIssueModal renderizado com initialComment
  // WHEN:  renderiza
  // THEN:  textarea contém o comentário inicial
  test('renderiza com comentário inicial', () => {
    renderWithSnackbar(
      <ReportIssueModal
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        initialComment="Comentário pré-preenchido"
      />
    )

    const textarea = screen.getByPlaceholderText('Comentário (opcional)') as HTMLTextAreaElement
    expect(textarea.value).toBe('Comentário pré-preenchido')
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  clicar em Enviar
  // THEN:  estado muda para success e texto muda
  test('muda para estado success ao clicar Enviar', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    expect(screen.queryByText('Problema enviado')).not.toBeInTheDocument()

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(screen.getByText('Problema enviado')).toBeInTheDocument()
  })

  // GIVEN: ReportIssueModal com initialComment
  // WHEN:  clicar Enviar
  // THEN:  onConfirm é chamado com comentário
  test('chama onConfirm com comentário ao Enviar', () => {
    renderWithSnackbar(
      <ReportIssueModal
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        initialComment="Erro na questão 5"
      />
    )

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(mockOnConfirm).toHaveBeenCalledWith('Erro na questão 5')
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  clicar Enviar sem comentário inicial
  // THEN:  onConfirm é chamado com undefined
  test('chama onConfirm com undefined quando sem comentário', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(mockOnConfirm).toHaveBeenCalledWith(undefined)
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  renderiza
  // THEN:  tem título correto
  test('tem título "Reportar problema" no estado inicial', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    expect(screen.getByText('Reportar problema')).toBeInTheDocument()
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  clicar Enviar
  // THEN:  título muda para "Problema enviado"
  test('titulo muda para "Problema enviado" em sucesso', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(screen.getByText('Problema enviado')).toBeInTheDocument()
    expect(screen.queryByText('Reportar problema')).not.toBeInTheDocument()
  })

  // GIVEN: ReportIssueModal renderizado
  // WHEN:  clicar Enviar
  // THEN:  mensagem de sucesso aparece
  test('exibe mensagem de agradecimento em sucesso', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(screen.getByText('Obrigado por reportar. Analisaremos em breve.')).toBeInTheDocument()
  })

  // GIVEN: ReportIssueModal em estado success
  // WHEN:  renderiza
  // THEN:  textarea desaparece (substituído pela mensagem de sucesso)
  test('textarea desaparece em estado success', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    expect(screen.getByPlaceholderText('Comentário (opcional)')).toBeInTheDocument()

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(screen.queryByPlaceholderText('Comentário (opcional)')).not.toBeInTheDocument()
  })

  // GIVEN: ReportIssueModal em estado success
  // WHEN:  renderiza
  // THEN:  botões desaparecem
  test('botões desaparecem em estado success', () => {
    renderWithSnackbar(
      <ReportIssueModal onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    )

    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Enviar')).toBeInTheDocument()

    const enviarBtn = screen.getByText('Enviar')
    act(() => {
      enviarBtn.click()
    })

    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
    expect(screen.queryByText('Enviar')).not.toBeInTheDocument()
  })
})
