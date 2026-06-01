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
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="bg-white rounded-xl shadow p-8 text-center space-y-4 w-80">
        <h1 className="text-xl font-bold text-slate-800">POSCOMP Admin</h1>
        <p className="text-sm text-slate-500">Acesso restrito a administradores</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  )
}
