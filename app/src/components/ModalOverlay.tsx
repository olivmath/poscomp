import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function ModalOverlay({
  children,
  onBackdropClick,
}: {
  children: React.ReactNode
  onBackdropClick?: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onBackdropClick?.()
      }}
    >
      {children}
    </div>,
    document.body
  )
}
