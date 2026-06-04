import { useLocation, useNavigate } from 'react-router-dom'
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <span style={{ fontWeight: 600, fontSize: 16, marginLeft: 8 }}>Resultado</span>
      </div>
      <RelatorioFinal
        result={result}
        variant="post-simulado"
        onNewSimulado={() => navigate('/')}
      />
    </div>
  )
}
