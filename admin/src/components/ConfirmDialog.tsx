import { ReactNode } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'primary' | 'danger'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'primary',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" style={{ zIndex: 100 }} onClick={onCancel}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: '20px' }}>{title}</h2>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontSize: '15px', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-ghost" disabled={loading}>
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn ${type === 'danger' ? 'btn-ghost' : 'btn-primary'}`}
            style={type === 'danger' ? { color: 'var(--md-sys-color-error)' } : {}}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
