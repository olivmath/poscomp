import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Announcement } from '../types'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    const q = query(collection(db, 'announcements'), where('active', '==', true))
    return onSnapshot(q, (snap) => {
      const now = new Date()
      setAnnouncements(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Announcement))
          .filter((a) => !a.expiresAt || a.expiresAt.toDate() > now)
      )
    })
  }, [])

  return announcements
}
