import { useLocation, useNavigate } from 'react-router-dom'
import { AppBarBack } from '../components/AppBarBack'
import { RelatorioFinal } from '../components/RelatorioFinal'
import { SimuladoResult } from '../types'

export function SimuladoResultado() {
  const location = useLocation()
  const navigate = useNavigate()
  const result: SimuladoResult | undefined = location.state?.result

  if (!result) {
    navigate('/')
    return null
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--md-sys-color-surface)' }}>
      <AppBarBack title="Resultado" onBack={() => navigate('/')} />
      <RelatorioFinal
        result={result}
        variant="post-simulado"
        onNewSimulado={() => navigate('/')}
      />
    </div>
  )
}
