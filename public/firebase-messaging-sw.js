importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyB6_sTMe0uLLnAZ62ej8lIFYVQe3sUxId4',
  authDomain: 'poscomp-olivmath.firebaseapp.com',
  projectId: 'poscomp-olivmath',
  storageBucket: 'poscomp-olivmath.firebasestorage.app',
  messagingSenderId: '21207774761',
  appId: '1:21207774761:web:8fc14d233a5663122a0e38',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title = 'POSCOMP', body = '' } = payload.notification ?? {}
  self.registration.showNotification(title, {
    body,
    icon: '/vite.svg',
    badge: '/vite.svg',
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
