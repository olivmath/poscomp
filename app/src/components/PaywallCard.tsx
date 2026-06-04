import '@material/web/button/filled-button.js'

interface PaywallCardProps {
  title: string
  description: string
  ctaLabel: string
  onCta: () => void
}

export function PaywallCard({ title, description, ctaLabel, onCta }: PaywallCardProps) {
  return (
    <div
      className="card page-placeholder"
      style={{ gap: 12, margin: '0 16px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.6 }}>
        lock
      </span>
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
        {description}
      </p>
      {/* @ts-expect-error custom element */}
      <md-filled-button onClick={onCta}>{ctaLabel}</md-filled-button>
    </div>
  )
}
