import { ModalOverlay } from './ModalOverlay'

interface ExitModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function ExitModal({ onConfirm, onCancel }: ExitModalProps) {
  return (
    <ModalOverlay onBackdropClick={onCancel}>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Sair do simulado</h3>
      <p style={{ margin: '0 0 24px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
        O progresso será perdido.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 16px',
            color: 'var(--md-sys-color-primary)',
            fontWeight: 600,
            borderRadius: 8,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          style={{
            background: 'var(--md-sys-color-error)',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 20px',
            color: 'var(--md-sys-color-on-error)',
            fontWeight: 600,
            borderRadius: 8,
          }}
        >
          Sair
        </button>
      </div>
    </ModalOverlay>
  )
}
