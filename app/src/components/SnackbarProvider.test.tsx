import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SnackbarProvider, useSnackbar } from './SnackbarProvider'

function TestComponent() {
  const { show } = useSnackbar()
  return (
    <div>
      <button onClick={() => show('Sucesso!', 'success')}>
        Mostrar Sucesso
      </button>
      <button onClick={() => show('Erro!', 'error')}>
        Mostrar Erro
      </button>
    </div>
  )
}

describe('SnackbarProvider', () => {
  // GIVEN: SnackbarProvider envolvendo TestComponent
  // WHEN:  TestComponent renderiza
  // THEN:  useSnackbar hook está disponível e funciona
  test('useSnackbar hook funciona dentro do provider', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    expect(screen.getByText('Mostrar Sucesso')).toBeInTheDocument()
  })

  // GIVEN: useSnackbar usado fora do provider
  // WHEN:  componente tenta usar o hook
  // THEN:  lança erro
  test('lança erro quando usado fora do provider', () => {
    const BadComponent = () => {
      const { show } = useSnackbar()
      return <button onClick={() => show('Test', 'success')}>Test</button>
    }

    expect(() => {
      render(<BadComponent />)
    }).toThrow('useSnackbar deve ser usado dentro de <SnackbarProvider>')
  })

  // GIVEN: SnackbarProvider renderizado
  // WHEN:  renderiza
  // THEN:  children renderizam corretamente
  test('renderiza children corretamente', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    )

    expect(screen.getByText('Mostrar Sucesso')).toBeInTheDocument()
    expect(screen.getByText('Mostrar Erro')).toBeInTheDocument()
  })

  // GIVEN: SnackbarProvider com show() chamado
  // WHEN:  hook show() é invocado com message e type
  // THEN:  função executada sem erro
  test('show() executa sem erro com type="success"', () => {
    const TestComponentWithCall = () => {
      const { show } = useSnackbar()
      return (
        <button onClick={() => show('Test', 'success')}>
          Call Show
        </button>
      )
    }

    expect(() => {
      render(
        <SnackbarProvider>
          <TestComponentWithCall />
        </SnackbarProvider>
      )

      screen.getByText('Call Show').click()
    }).not.toThrow()
  })

  // GIVEN: SnackbarProvider com show() chamado múltiplas vezes
  // WHEN:  múltiplas mensagens são adicionadas
  // THEN:  nenhum erro é lançado
  test('adiciona múltiplas mensagens sem erro', () => {
    const TestComponentMultiple = () => {
      const { show } = useSnackbar()
      return (
        <div>
          <button onClick={() => show('Msg1', 'success')}>Msg1</button>
          <button onClick={() => show('Msg2', 'error')}>Msg2</button>
        </div>
      )
    }

    expect(() => {
      render(
        <SnackbarProvider>
          <TestComponentMultiple />
        </SnackbarProvider>
      )

      screen.getByText('Msg1').click()
      screen.getByText('Msg2').click()
    }).not.toThrow()
  })

  // GIVEN: SnackbarProvider envolvendo TestComponent
  // WHEN:  TestComponent renderiza
  // THEN:  TestComponent está dentro do provider
  test('Provider renderiza children dentro do context', () => {
    render(
      <SnackbarProvider>
        <div data-testid="test-child">Test</div>
      </SnackbarProvider>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  // GIVEN: SnackbarProvider com show() chamado com diferentes tipos
  // WHEN:  múltiplas mensagens com tipos diferentes
  // THEN:  nenhum erro é lançado
  test('show() funciona com tipos "success", "error", "info"', () => {
    const TestComponentTypes = () => {
      const { show } = useSnackbar()
      return (
        <div>
          <button onClick={() => show('Success', 'success')}>S</button>
          <button onClick={() => show('Error', 'error')}>E</button>
          <button onClick={() => show('Info', 'info')}>I</button>
        </div>
      )
    }

    expect(() => {
      render(
        <SnackbarProvider>
          <TestComponentTypes />
        </SnackbarProvider>
      )

      screen.getByText('S').click()
      screen.getByText('E').click()
      screen.getByText('I').click()
    }).not.toThrow()
  })
})
