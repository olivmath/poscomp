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
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-slate-600">Verificando acesso...</span>
      </div>
    </div>
  )

  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  if (status === 'denied') return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-6 w-96 border border-slate-200">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          🚫
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Acesso negado</h2>
          <p className="text-sm font-medium text-slate-600">Sua conta não tem permissão de administrador.</p>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="w-full bg-slate-100 text-slate-700 rounded-xl py-3 text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
        >
          Sair e trocar de conta
        </button>
      </div>
    </div>
  )

  return <Outlet />
}
