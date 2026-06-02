import { useEffect, useState } from 'react'
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { PremiumStatus } from '../types'

export function useUserProfile(uid: string | null) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setPremiumStatus('free')
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

  return { premiumStatus, isPremium: premiumStatus === 'premium', loading }
}
