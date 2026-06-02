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
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-6 w-96 border border-slate-200">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">POSCOMP</h1>
          <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider">Admin Console</p>
        </div>
        <p className="text-base text-slate-600 leading-relaxed">Acesso restrito a administradores do sistema.</p>
        {error && <p className="text-sm font-medium text-red-600 bg-red-50 py-2 rounded-lg">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 text-base font-semibold shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Verificando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  )
}
