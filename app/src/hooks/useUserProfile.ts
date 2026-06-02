import { useEffect, useState } from 'react'
import { doc, onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { PremiumStatus } from '../types'

export function useUserProfile(uid: string | null) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>('free')
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setPremiumStatus('free')
      setPremiumExpiresAt(null)
      setLoading(false)
      return
    }

    let isPremiumFromDoc = false
    let hasPendingRequest = false
    let profileResolved = false
    let pendingResolved = false

    function resolve() {
      if (!profileResolved || !pendingResolved) return
      if (isPremiumFromDoc) setPremiumStatus('premium')
      else if (hasPendingRequest) setPremiumStatus('pending')
      else setPremiumStatus('free')
      setLoading(false)
    }

    const userRef = doc(db, 'users', uid)
    const unsubProfile = onSnapshot(userRef, (snap) => {
      isPremiumFromDoc = snap.exists() ? snap.data()?.isPremium === true : false
      const raw = snap.exists() ? snap.data()?.premiumExpiresAt : null
      setPremiumExpiresAt(raw instanceof Timestamp ? raw.toDate() : null)
      profileResolved = true
      resolve()
    })

    const requestsQuery = query(
      collection(db, 'premium_requests'),
      where('uid', '==', uid),
      where('status', '==', 'pending'),
    )
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      hasPendingRequest = !snap.empty
      pendingResolved = true
      resolve()
    })

    return () => {
      unsubProfile()
      unsubRequests()
    }
  }, [uid])

  return { premiumStatus, isPremium: premiumStatus === 'premium', premiumExpiresAt, loading }
}
