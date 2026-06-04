import { ReactNode } from 'react'

interface ModalOverlayProps {
  children: ReactNode
  onBackdropClick?: () => void
}

export function ModalOverlay({ children, onBackdropClick }: ModalOverlayProps) {
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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--md-sys-color-surface-container)',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
