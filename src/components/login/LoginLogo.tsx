export function LoginLogo() {
  return (
    <div className="login-logo">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <rect width="72" height="72" rx="22" fill="var(--md-sys-color-primary)" />
        <rect x="10" y="10" width="52" height="52" rx="14" fill="var(--md-sys-color-primary-container)" fillOpacity="0.15" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="38"
          fontWeight="800"
          fontFamily="Google Sans, system-ui, sans-serif"
          fill="var(--md-sys-color-on-primary)"
          letterSpacing="-1"
        >
          P
        </text>
      </svg>
    </div>
  )
}
