importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBfoDg9uBi5GU_NU_IYNC_Iwp6iVvYrbaE",
  authDomain: "appzeto-55c6f.firebaseapp.com",
  projectId: "appzeto-55c6f",
  storageBucket: "appzeto-55c6f.firebasestorage.app",
  messagingSenderId: "753827883600",
  appId: "1:753827883600:web:0b7eb36ddc506e095b7f55",
});

const messaging = firebase.messaging();

// Background handler — data-only messages need manual showNotification
messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || 'Appzeto Helpdesk';
  const body = payload.data?.body || 'You have a new ticket assignment';
  const ticketId = payload.data?.ticketId;

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: ticketId || 'helpdesk',
    data: { url: ticketId ? `/tickets/${ticketId}` : '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(self.location.origin + url);
    })
  );
});
