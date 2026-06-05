// Firebase config is intentionally duplicated here — service workers run in a
// separate context and cannot access import.meta.env. Fill these values from
// your Firebase project settings (they are not secret; they appear in the
// client bundle as well).
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title = 'POSCOMP', body = '' } = payload.notification ?? {}
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    data: payload.data,
    vibrate: [200, 100, 200],
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
