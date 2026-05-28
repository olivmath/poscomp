import '@material/web/button/filled-button.js'
import '@material/web/progress/circular-progress.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const confettiFired = useRef(false)

  useEffect(() => {
    if (!user) return

    setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
    }, { merge: true })

    if (!confettiFired.current) {
      confettiFired.current = true
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#006C6C', '#4FDADA', '#B2DFDB', '#002020', '#FFFFFF'],
      })
    }
  }, [user])

  const firstName = user?.displayName?.split(' ')[0] ?? ''

  return (
    <div className="home-container">
      <div className="home-card">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'Avatar'}
            className="home-avatar"
          />
        ) : (
          <div className="perfil-avatar-placeholder" style={{ width: 80, height: 80 }}>
            <span className="material-symbols-outlined md-icon--md">person</span>
          </div>
        )}

        <h1 className="home-greeting">
          Ola, {firstName}!
        </h1>
        <p className="home-email">{user?.email}</p>

        <div className="home-actions">
          <md-filled-button
            onClick={() => navigate('/simulado')}
            data-testid="start-simulado-btn"
          >
            Comecar Simulado
          </md-filled-button>
        </div>
      </div>
    </div>
  )
}
