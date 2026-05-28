import '@material/web/button/filled-button.js'
import '@material/web/progress/circular-progress.js'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch (err) {
      setError('Falha ao fazer login. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#006C6C"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
              fontSize="28" fontWeight="700" fill="white">P</text>
          </svg>
        </div>
        <h1 className="login-title">Poscomp</h1>
        <p className="login-subtitle">Prepare-se para o sucesso</p>

        {error && <p className="login-error">{error}</p>}

        {loading ? (
          <md-circular-progress indeterminate style={{ '--md-circular-progress-size': '48px' } as React.CSSProperties} />
        ) : (
          <md-filled-button
            onClick={handleGoogleSignIn}
            style={{ minWidth: '240px' } as React.CSSProperties}
          >
            <svg slot="icon" width="18" height="18" viewBox="0 0 18 18">
              <path fill="#fff" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#fff" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#fff" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#fff" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.48a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Entrar com Google
          </md-filled-button>
        )}
      </div>
    </div>
  )
}
