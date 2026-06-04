import { ModalOverlay } from './ModalOverlay'

interface ConfirmDeleteModalProps {
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ deleting, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <ModalOverlay>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Apagar tudo?</h3>
      <p style={{ margin: '0 0 8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
        Esta ação remove permanentemente:
      </p>
      <ul style={{ margin: '0 0 24px', paddingLeft: 20, fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>
        <li>Todo o histórico de simulados</li>
        <li>Todos os cards de revisão</li>
        <li>Estatísticas e progresso</li>
      </ul>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--md-sys-color-error)', fontWeight: 600 }}>
        Essa ação não pode ser desfeita.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={deleting}
          style={{
            background: 'none',
            border: 'none',
            cursor: deleting ? 'not-allowed' : 'pointer',
            padding: '10px 16px',
            color: 'var(--md-sys-color-primary)',
            fontWeight: 600,
            borderRadius: 8,
            opacity: deleting ? 0.5 : 1,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          style={{
            background: 'var(--md-sys-color-error)',
            border: 'none',
            cursor: deleting ? 'not-allowed' : 'pointer',
            padding: '10px 20px',
            color: 'var(--md-sys-color-on-error)',
            fontWeight: 600,
            borderRadius: 8,
            opacity: deleting ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {deleting && (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
            >
              progress_activity
            </span>
          )}
          Apagar tudo
        </button>
      </div>
    </ModalOverlay>
  )
}
