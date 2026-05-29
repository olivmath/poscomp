import '@material/web/button/filled-button.js'
import '@material/web/progress/circular-progress.js'
import { ReactNode } from 'react'

interface LoginCardProps {
  loading: boolean
  error: string
  onSignIn: () => void
  children?: ReactNode
}

const GoogleIcon = () => (
  <svg slot="icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.48a4.77 4.77 0 0 1 4.48-3.3z"/>
  </svg>
)

export function LoginCard({ loading, error, onSignIn, children }: LoginCardProps) {
  return (
    <div className="login-card">
      {children}

      <div className="login-cta-area">
        {error && (
          <p className="login-error" role="alert">
            <span className="login-error-icon" aria-hidden="true">⛔</span>
            {error}
          </p>
        )}

        {loading ? (
          <div className="login-loading">
            <md-circular-progress
              indeterminate
              style={{ '--md-circular-progress-size': '48px' } as React.CSSProperties}
              aria-label="Autenticando"
            />
            <p className="login-loading-text">Autenticando...</p>
          </div>
        ) : (
          <md-filled-button onClick={onSignIn} className="btn-full" aria-label="Entrar com Google">
            <GoogleIcon />
            Entrar com Google
          </md-filled-button>
        )}
      </div>

      <p className="login-legal">
        Ao entrar, você concorda com nossos{' '}
        <span className="login-legal-link">Termos</span>{' '}
        e{' '}
        <span className="login-legal-link">Políticas de Privacidade</span>.
      </p>
    </div>
  )
}
