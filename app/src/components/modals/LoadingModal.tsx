import { ModalOverlay } from './ModalOverlay'

export function LoadingModal() {
  return (
    <ModalOverlay>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '8px 0',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 48,
            color: 'var(--md-sys-color-primary)',
            animation: 'spin 1s linear infinite',
          }}
        >
          progress_activity
        </span>
        <p style={{ margin: 0, fontWeight: 600 }}>Calculando resultado…</p>
      </div>
    </ModalOverlay>
  )
}
