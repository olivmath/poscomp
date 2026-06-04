/* Mesmo padrão do app/src/components/modals/ModalOverlay.tsx, com maxWidth maior para desktop */
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onBackdropClick?: () => void
  maxWidth?: number
}

export function ModalOverlay({ children, onBackdropClick, maxWidth = 560 }: Props) {
  return (
    <div
      onClick={onBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 24,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--md-sys-color-surface)',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
