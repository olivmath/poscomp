import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAdmin: false, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const token = await u.getIdTokenResult()
        setIsAdmin(!!token.claims['admin'])
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, isAdmin, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
