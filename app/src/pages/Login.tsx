import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { user, loading } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) return <Navigate to="/" replace />

  async function handleGoogle() {
    setSigningIn(true)
    setError('')
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      setError('Falha ao entrar com Google. Tente novamente.')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--md-sys-color-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 72, color: 'var(--md-sys-color-primary)', display: 'block', marginBottom: 16 }}
        >
          school
        </span>
        <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
          POSCOMP
        </h1>
        <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 16 }}>
          Prepare-se para o sucesso
        </p>
      </div>

      <div
        className="card"
        style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <button
          onClick={handleGoogle}
          disabled={signingIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 20px',
            border: '1px solid var(--md-sys-color-outline)',
            borderRadius: 8,
            background: 'var(--md-sys-color-surface)',
            cursor: signingIn ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface)',
            opacity: signingIn ? 0.7 : 1,
          }}
        >
          {signingIn ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, animation: 'spin 1s linear infinite', color: 'var(--md-sys-color-primary)' }}
            >
              progress_activity
            </span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {signingIn ? 'Entrando…' : 'Entrar com Google'}
        </button>

        {error && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-error)', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
