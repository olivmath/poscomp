import { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function usePendingCount() {
  const { user, userDoc } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user || !userDoc?.isPremium) return
    const fn = httpsCallable<Record<string, never>, { count: number }>(functions, 'getPendingCount')
    fn({}).then((r) => setCount(r.data.count)).catch(() => null)
  }, [user, userDoc?.isPremium])

  return count
}
