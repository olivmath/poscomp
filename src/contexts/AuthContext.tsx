import { createContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

declare global {
  interface Window {
    /** Set by Playwright via addInitScript to bypass Firebase auth in E2E tests. */
    __AUTH_BYPASS__?: boolean
  }
}

const MOCK_USER: User = {
  uid: 'test-uid-123',
  email: 'test@poscomp.dev',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: 'fake-refresh-token',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'fake-id-token',
  getIdTokenResult: async () => ({} as never),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  providerId: 'google.com',
} as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
  const bypass = typeof window !== 'undefined' && window.__AUTH_BYPASS__ === true
  const [user, setUser] = useState<User | null>(bypass ? MOCK_USER : null)
  const [loading, setLoading] = useState(!bypass)

  useEffect(() => {
    if (window.__AUTH_BYPASS__) return

    getRedirectResult(auth).catch(console.error)

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

