import '@material/web/button/filled-button.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const confettiFired = useRef(false)

  // Salvar perfil no Firestore + confete no login
  useEffect(() => {
    if (!user) return

    // Salvar perfil
    setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
    }, { merge: true })

    // Confete apenas uma vez
    if (!confettiFired.current) {
      confettiFired.current = true
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6750A4', '#D0BCFF', '#E8DEF8', '#21005D', '#FFFFFF'],
      })
    }
  }, [user])

  return (
    <div className="home-container">
      <div className="home-card">
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'Avatar'}
            className="home-avatar"
          />
        )}

        <h1 className="home-greeting">
          Olá, {user?.displayName?.split(' ')[0]}!
        </h1>
        <p className="home-email">{user?.email}</p>

        <div className="home-actions">
          <md-filled-button
            onClick={() => navigate('/simulado')}
            style={{ minWidth: '200px' }}
            data-testid="start-simulado-btn"
          >
            Começar Simulado
          </md-filled-button>
        </div>
      </div>
    </div>
  )
}
