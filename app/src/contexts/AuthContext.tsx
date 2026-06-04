import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { onSnapshot, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { UserDoc } from '../types'

interface AuthContextValue {
  user: User | null
  userDoc: UserDoc | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, userDoc: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        setUserDoc(null)
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      if (!snap.exists()) {
        const defaults: UserDoc = { isPremium: false, planType: 'free', premiumStatus: 'free' }
        await setDoc(doc(db, 'users', user.uid), defaults)
      } else {
        setUserDoc(snap.data() as UserDoc)
        setLoading(false)
      }
    })
    return unsub
  }, [user])

  return <AuthContext.Provider value={{ user, userDoc, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
