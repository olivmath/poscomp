import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export function E2EAdminLogin() {
  const [status, setStatus] = useState('entrando...')

  useEffect(() => {
    if (import.meta.env.MODE === 'production') {
      setStatus('desabilitado em produção')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || 'e2e-admin@local.test'
    const pwd = params.get('pwd') || 'pass1234'

    signInWithEmailAndPassword(auth, email, pwd)
      .then(() => { window.location.href = '/dashboard' })
      .catch((err) => { setStatus('erro: ' + (err?.message ?? String(err))) })
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin E2E Auth</h2>
      <p>{status}</p>
    </div>
  )
}
