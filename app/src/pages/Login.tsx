import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LoginLogo } from '../components/login/LoginLogo'
import { LoginCard } from '../components/login/LoginCard'

export function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch {
      setError('Falha ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <LoginCard loading={loading} error={error} onSignIn={handleGoogleSignIn}>
        <LoginLogo />
        <h1 className="login-title">POSCOMP</h1>
        <p className="login-subtitle">Prepare-se para o sucesso</p>
      </LoginCard>
    </div>
  )
}
