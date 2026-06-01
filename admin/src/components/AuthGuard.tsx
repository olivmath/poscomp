import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

type Status = 'loading' | 'admin' | 'denied' | 'unauthenticated'

export function AuthGuard() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      console.log('[AuthGuard] user:', user?.uid ?? 'null')
      if (!user) { setStatus('unauthenticated'); return }
      const token = await user.getIdTokenResult()
      console.log('[AuthGuard] claims:', token.claims)
      const isAdmin = token.claims.admin === true
      console.log('[AuthGuard] isAdmin:', isAdmin)
      setStatus(isAdmin ? 'admin' : 'denied')
    })
  }, [])

  if (status === 'loading') return (
    <div className="flex h-screen items-center justify-center">
      <span className="text-slate-500">Verificando acesso...</span>
    </div>
  )

  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  if (status === 'denied') return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="bg-white rounded-xl shadow p-8 text-center space-y-4 w-80">
        <p className="text-2xl">🚫</p>
        <h2 className="font-bold text-slate-800">Acesso negado</h2>
        <p className="text-sm text-slate-500">Sua conta não tem permissão de admin.</p>
        <button
          onClick={() => signOut(auth)}
          className="w-full bg-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-300"
        >
          Sair e trocar de conta
        </button>
      </div>
    </div>
  )

  return <Outlet />
}
