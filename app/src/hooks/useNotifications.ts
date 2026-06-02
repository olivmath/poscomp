import { useState, useEffect, useCallback } from 'react'
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore'
import { app, db } from '../firebase'
import { useAuth } from './useAuth'

export interface UseNotificationsReturn {
  permission: NotificationPermission | 'unsupported'
  enabled: boolean
  loading: boolean
  toggle: () => Promise<void>
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    !!VAPID_KEY
  )
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    isSupported() ? Notification.permission : 'unsupported',
  )
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load current preference from Firestore
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        setEnabled(snap.data()?.notificationsEnabled === true)
      }
    })
  }, [user])

  // Foreground message handler — shows a native notification while app is open
  useEffect(() => {
    if (!isSupported() || !user) return
    const messaging = getMessaging(app)
    const unsub = onMessage(messaging, (payload) => {
      const { title = 'POSCOMP', body = '' } = payload.notification ?? {}
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' })
      }
    })
    return unsub
  }, [user])

  const toggle = useCallback(async () => {
    if (!user || !isSupported()) return
    setLoading(true)
    try {
      const messaging = getMessaging(app)

      if (enabled) {
        // Disable: delete token + update Firestore
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null)
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          notificationsEnabled: false,
          ...(currentToken ? { fcmTokens: arrayRemove(currentToken) } : {}),
        })
        if (currentToken) await deleteToken(messaging).catch(() => {})
        setEnabled(false)
        setPermission(Notification.permission)
      } else {
        // Enable: request permission → get token → save to Firestore
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result !== 'granted') return

        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          notificationsEnabled: true,
          fcmTokens: arrayUnion(token),
        })
        setEnabled(true)
      }
    } finally {
      setLoading(false)
    }
  }, [user, enabled])

  return { permission, enabled, loading, toggle }
}
