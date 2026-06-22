import { useNavigate } from 'react-router-dom'

interface AppBarBackProps {
  title: string
  onBack?: () => void
}

export function AppBarBack({ title, onBack }: AppBarBackProps) {
  const navigate = useNavigate()

  function handleBack() {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        background: 'var(--md-sys-color-surface)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <button
        onClick={handleBack}
        aria-label="Voltar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'var(--md-sys-color-on-surface)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
        {title}
      </span>
    </div>
  )
}
