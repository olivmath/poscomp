import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Materia, SimuladoConfig as SimuladoConfigType } from '../types'

const MATERIAS: { id: Materia; label: string; icon: string }[] = [
  { id: 'Matemática', label: 'Mat.', icon: 'calculate' },
  { id: 'Computação', label: 'Fund.', icon: 'memory' },
  { id: 'Tecnologias', label: 'Tec.', icon: 'developer_board' },
]

const TOTALS = [5, 10, 20, 0] as const
const TOTAL_LABELS = ['5', '10', '20', 'Máx']

const TIMERS: SimuladoConfigType['timerMode'][] = ['none', '1min', '2min']
const TIMER_LABELS = ['Sem limite', '1 min', '2 min']

export function SimuladoConfig() {
  const navigate = useNavigate()
  const [selectedMaterias, setSelectedMaterias] = useState<Materia[]>([])
  const [total, setTotal] = useState<number>(5)
  const [timerMode, setTimerMode] = useState<SimuladoConfigType['timerMode']>('none')

  function toggleMateria(m: Materia) {
    setSelectedMaterias((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  }

  function handleStart() {
    const config: SimuladoConfigType = {
      materias: selectedMaterias,
      total,
      timerMode,
    }
    navigate('/simulado/running', { state: { config } })
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--md-sys-color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Configurar Simulado</h2>

        {/* Step 1: Temas */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
            ① Temas
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedMaterias([])}
              style={chipStyle(selectedMaterias.length === 0)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>apps</span>
              Todas
            </button>
            {MATERIAS.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMateria(m.id)}
                style={chipStyle(selectedMaterias.includes(m.id))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Nº de questões */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
            ② Nº de questões
          </p>
          <div style={{ display: 'flex', border: '1px solid var(--md-sys-color-outline)', borderRadius: 8, overflow: 'hidden' }}>
            {TOTALS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTotal(t)}
                style={segmentStyle(total === t, i === 0, i === TOTALS.length - 1)}
              >
                {TOTAL_LABELS[i]}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Tempo */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
            ③ Tempo/questão
          </p>
          <div style={{ display: 'flex', border: '1px solid var(--md-sys-color-outline)', borderRadius: 8, overflow: 'hidden' }}>
            {TIMERS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTimerMode(t)}
                style={segmentStyle(timerMode === t, i === 0, i === TIMERS.length - 1)}
              >
                {TIMER_LABELS[i]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              padding: '12px 0',
              border: '1px solid var(--md-sys-color-outline)',
              borderRadius: 8,
              background: 'none',
              cursor: 'pointer',
              color: 'var(--md-sys-color-on-surface)',
              fontWeight: 600,
            }}
          >
            Voltar
          </button>
          <button
            onClick={handleStart}
            style={{
              flex: 2,
              padding: '12px 0',
              border: 'none',
              borderRadius: 8,
              background: 'var(--md-sys-color-primary)',
              cursor: 'pointer',
              color: 'var(--md-sys-color-on-primary)',
              fontWeight: 700,
            }}
          >
            Começar Simulado
          </button>
        </div>
      </div>
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    borderRadius: 20,
    border: `1px solid ${active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
    background: active ? 'var(--md-sys-color-primary-container)' : 'transparent',
    color: active ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  }
}

function segmentStyle(active: boolean, first: boolean, last: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '10px 8px',
    border: 'none',
    borderRight: last ? 'none' : '1px solid var(--md-sys-color-outline)',
    background: active ? 'var(--md-sys-color-primary)' : 'transparent',
    color: active ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    borderRadius: first ? '7px 0 0 7px' : last ? '0 7px 7px 0' : 0,
  }
}
