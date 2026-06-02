import { createContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'
import { useUserProfile } from '../hooks/useUserProfile'
import type { PremiumStatus, PlanType } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isPremium: boolean
  premiumStatus: PremiumStatus
  premiumExpiresAt: Date | null
  planType: PlanType
  profileLoading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  premiumStatus: 'free',
  premiumExpiresAt: null,
  planType: 'free',
  profileLoading: true,
})

function AuthProviderInner({ user, loading, children }: { user: User | null; loading: boolean; children: ReactNode }) {
  const { isPremium, premiumStatus, premiumExpiresAt, planType, loading: profileLoading } = useUserProfile(user?.uid ?? null)

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, premiumStatus, premiumExpiresAt, planType, profileLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthProviderInner user={user} loading={loading}>
      {children}
    </AuthProviderInner>
  )
}
