import { createContext, useState, useCallback, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'

export type SnackbarType = 'success' | 'error' | 'info'

interface SnackbarMessage {
  id: string
  message: string
  type: SnackbarType
  duration: number
}

interface SnackbarContextType {
  show: (message: string, type: SnackbarType, duration?: number) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export function useSnackbar() {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar deve ser usado dentro de <SnackbarProvider>')
  }
  return context
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SnackbarMessage[]>([])

  const show = useCallback(
    (message: string, type: SnackbarType, duration: number = 3000) => {
      const id = `${Date.now()}-${Math.random()}`
      setMessages((prev) => [...prev, { id, message, type, duration }])

      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id))
      }, duration)
    },
    []
  )

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="snackbar-container" role="region" aria-live="polite" aria-label="Notificações">
          {messages.map((msg) => (
            <SnackbarItem key={msg.id} {...msg} />
          ))}
        </div>,
        document.body
      )}
    </SnackbarContext.Provider>
  )
}

function SnackbarItem({ message, type }: SnackbarMessage) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  const bgColor = {
    success: 'var(--md-sys-color-primary)',
    error: 'var(--md-sys-color-error)',
    info: 'var(--md-sys-color-secondary)',
  }[type]

  const icon = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  }[type]

  return (
    <div
      className="snackbar-item"
      style={{ backgroundColor: bgColor }}
      role="status"
      aria-live="assertive"
    >
      <div className="snackbar-content">
        <span className="material-symbols-outlined snackbar-icon">{icon}</span>
        <span className="snackbar-message">{message}</span>
      </div>
      <button
        className="snackbar-close-btn"
        onClick={handleClose}
        aria-label="Fechar notificação"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  )
}
