import '@material/web/button/filled-button.js'
import '@material/web/icon/icon.js'
import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth, googleProvider } from '../firebase'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    console.log('[LoginPage] signInWithPopup iniciado')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      console.log('[LoginPage] login ok, uid:', result.user.uid)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      console.error('[LoginPage] erro no login:', e)
      setError('Falha ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page-container">
      <div className="card login-card-admin">
        <div className="login-header-admin">
          <h1 className="login-logo-text-admin">POSCOMP</h1>
          <p className="login-badge-admin">Admin Console</p>
        </div>

        <div className="login-body-admin">
          <p className="login-desc-admin">
            Bem-vindo ao portal administrativo. Acesse para gerenciar questões, usuários e banners.
          </p>
          
          {error && (
            <div className="login-error-admin" role="alert">
              {error}
            </div>
          )}
        </div>

        <md-filled-button
          onClick={handleLogin}
          disabled={loading}
          className="login-btn-admin"
        >
          <md-icon slot="icon">login</md-icon>
          {loading ? 'Verificando...' : 'Entrar com Google'}
        </md-filled-button>

        <p className="login-footer-text-admin">
          Acesso restrito a administradores autorizados.
        </p>
      </div>
    </div>
  )
}
