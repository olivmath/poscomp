import { ModalOverlay } from './ModalOverlay'
import { SimuladoAnswer, Option } from '../../types'

interface QuestionMapModalProps {
  answers: SimuladoAnswer[]
  currentIndex: number
  onNavigate: (index: number) => void
  onClose: () => void
}

const OPTION_COLORS: Record<Option, string> = {
  A: 'var(--color-option-a)',
  B: 'var(--color-option-b)',
  C: 'var(--color-option-c)',
  D: 'var(--color-option-d)',
  E: 'var(--color-option-e)',
}

export function QuestionMapModal({ answers, currentIndex, onNavigate, onClose }: QuestionMapModalProps) {
  return (
    <ModalOverlay onBackdropClick={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Mapa de Questões</h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
        }}
      >
        {answers.map((a, i) => {
          const isCurrent = i === currentIndex
          const isAnswered = a.selected !== null
          const isSkipped = a.skipped

          let bg = 'var(--md-sys-color-surface-variant)'
          let color = 'var(--md-sys-color-on-surface-variant)'
          let border = '2px solid transparent'

          if (isAnswered && a.selected) {
            bg = OPTION_COLORS[a.selected]
            color = 'var(--md-sys-color-on-primary)'
          } else if (isSkipped) {
            bg = 'transparent'
            border = '2px solid var(--md-sys-color-outline)'
            color = 'var(--md-sys-color-on-surface-variant)'
          }

          if (isCurrent) {
            border = '2px solid var(--md-sys-color-primary)'
          }

          return (
            <button
              key={a.questionId}
              onClick={() => { onNavigate(i); onClose() }}
              style={{
                background: bg,
                border,
                borderRadius: 8,
                padding: '8px 4px',
                cursor: 'pointer',
                color,
                fontWeight: isCurrent ? 700 : 500,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
              aria-label={`Questão ${i + 1}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span style={{ fontSize: 11, opacity: 0.8 }}>Q{i + 1}</span>
              {isAnswered && a.selected ? (
                <span style={{ fontWeight: 700 }}>{a.selected}</span>
              ) : isSkipped ? (
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>skip_next</span>
              ) : (
                <span style={{ fontSize: 14 }}>○</span>
              )}
            </button>
          )
        })}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
        <span>○ Não respondida</span>
        <span style={{ color: 'var(--color-option-b)' }}>● Respondida</span>
        <span>⊘ Pulada</span>
      </div>
    </ModalOverlay>
  )
}
