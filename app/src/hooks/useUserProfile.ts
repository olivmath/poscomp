import { useEffect, useState } from 'react'
import { doc, onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { PremiumStatus, PlanType } from '../types'

export function useUserProfile(uid: string | null) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>('free')
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<Date | null>(null)
  const [planType, setPlanType] = useState<PlanType>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setPremiumStatus('free')
      setPremiumExpiresAt(null)
      setPlanType('free')
      setLoading(false)
      return
    }

    let isPremiumFromDoc = false
    let hasPendingRequest = false
    let profileResolved = false
    let pendingResolved = false
    let expiresAt: Date | null = null
    let docPlanType: PlanType = 'free'

    function resolve() {
      if (!profileResolved || !pendingResolved) return

      const now = new Date()
      const expired = expiresAt !== null && expiresAt < now

      if (isPremiumFromDoc && !expired) {
        setPremiumStatus('premium')
        setPlanType(docPlanType)
      } else if (hasPendingRequest) {
        setPremiumStatus('pending')
        setPlanType('free')
      } else {
        setPremiumStatus('free')
        setPlanType('free')
      }
      setLoading(false)
    }

    const userRef = doc(db, 'users', uid)
    const unsubProfile = onSnapshot(userRef, (snap) => {
      isPremiumFromDoc = snap.exists() ? snap.data()?.isPremium === true : false
      const raw = snap.exists() ? snap.data()?.premiumExpiresAt : null
      expiresAt = raw instanceof Timestamp ? raw.toDate() : null
      setPremiumExpiresAt(expiresAt)
      docPlanType = (snap.exists() ? snap.data()?.planType : null) ?? 'free'
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

  return { premiumStatus, isPremium: premiumStatus === 'premium', premiumExpiresAt, planType, loading }
}
