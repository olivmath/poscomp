import '@material/web/dialog/dialog.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-button.js'

interface Props {
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

import { useEffect, useRef } from 'react'

export function ConfirmDialog({ title, body, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const el = container.querySelector('md-dialog') as HTMLElement | null
    if (!el) return
    const handler = () => onCancel()
    el.addEventListener('closed', handler)
    return () => el.removeEventListener('closed', handler)
  }, [onCancel])

  return (
    <div ref={containerRef}>
      <md-dialog open>
        <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {danger && (
            <span className="material-symbols-outlined" style={{ color: 'var(--md-sys-color-error)', fontSize: 24 }}>
              warning
            </span>
          )}
          <span style={{ fontSize: 20, fontWeight: 500 }}>{title}</span>
        </div>
        <div slot="content" style={{ fontSize: 15, color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6, padding: '8px 0' }}>
          {body}
        </div>
        <div slot="actions">
          <md-text-button onClick={onCancel} style={{ marginRight: 8 }}>Cancelar</md-text-button>
          <md-filled-button
            onClick={onConfirm}
            style={danger ? { '--md-filled-button-container-color': 'var(--md-sys-color-error)', '--md-filled-button-label-text-color': 'var(--md-sys-color-on-error)' } as React.CSSProperties : undefined}
          >
            {confirmLabel}
          </md-filled-button>
        </div>
      </md-dialog>
    </div>
  )
}
