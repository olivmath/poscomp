import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export function E2ELogin() {
  const [status, setStatus] = useState('iniciando')

  useEffect(() => {
    // Apenas disponível em ambiente de desenvolvimento/emulador
    if (import.meta.env.MODE === 'production') {
      setStatus('desabilitado em produção')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || `e2e+${Date.now()}@local.test`
    const pwd = params.get('pwd') || 'password123'

    setStatus('criando usuário')

    createUserWithEmailAndPassword(auth, email, pwd)
      .catch((err) => {
        // se já existe, tenta logar
        if (err?.code === 'auth/email-already-in-use') return signInWithEmailAndPassword(auth, email, pwd)
        throw err
      })
      .then(async () => {
        const user = auth.currentUser
        if (user) {
          // garante documento de usuário para habilitar conteúdos premium e outros campos necessários
          await setDoc(doc(db, 'users', user.uid), {
            isPremium: true,
            planType: 'pro',
            activeDays: [],
            displayName: user.displayName ?? 'E2E Test'
          }, { merge: true })
        }
        // redireciona para a home
        window.location.href = '/'
      })
      .catch((err) => {
        setStatus('erro: ' + (err?.message ?? String(err)))
      })
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2>Configuração de teste (E2E)</h2>
      <p>{status}</p>
      <p>Use query params: ?email=you@local.test&pwd=senha</p>
    </div>
  )
}
