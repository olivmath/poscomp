import '@material/web/button/filled-button.js'
import '@material/web/progress/circular-progress.js'
import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'

export function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">POSCOMP Admin</div>
        <div className="auth-subtitle">Acesso restrito a administradores</div>
        {error && (
          <div className="error-banner" style={{ marginBottom: 16, textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
            {error}
          </div>
        )}
        <md-filled-button onClick={handleGoogle} {...(loading ? { disabled: true } : {})} style={{ width: '100%' }}>
          {loading
            ? <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '20px', '--md-circular-progress-active-indicator-color': 'white' } as React.CSSProperties} />
            : <>
                <span className="material-symbols-outlined" slot="icon">account_circle</span>
                Entrar com Google
              </>}
        </md-filled-button>
      </div>
    </div>
  )
}
