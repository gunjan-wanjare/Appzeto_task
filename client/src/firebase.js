import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBfoDg9uBi5GU_NU_IYNC_Iwp6iVvYrbaE",
  authDomain: "appzeto-55c6f.firebaseapp.com",
  projectId: "appzeto-55c6f",
  storageBucket: "appzeto-55c6f.firebasestorage.app",
  messagingSenderId: "753827883600",
  appId: "1:753827883600:web:0b7eb36ddc506e095b7f55",
  measurementId: "G-FJHPXV0S4Q"
};

export const VAPID_KEY = "BNVOl4VYRllCQ_9SnpRrcFlCBXuKj9ZMiNsyIJDtHHjEoOvZ04SGavgZVC5pWGIumn6mko7_XuLrrg0N23LwGs8";

const app = initializeApp(firebaseConfig);

let swRegistration = null;
let setupPromise = null;

function setup() {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    try {
      const supported = await isSupported();
      if (!supported) return null;
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      console.log('[FCM] Messaging setup done ✅');
      return messaging;
    } catch (err) {
      console.error('[FCM] Setup error:', err.message);
      setupPromise = null;
      return null;
    }
  })();
  return setupPromise;
}

let foregroundListenerRegistered = false;
let activeCallback = null;

// Eagerly initialize
setup();

export async function requestNotificationPermission(agentName) {
  try {
    console.log('[FCM] Requesting permission...');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const msg = await setup();
    if (!msg) return null;

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    console.log('[FCM] Token:', token ? '✅ ' + token.substring(0, 20) + '...' : '❌ null');

    if (token && agentName) {
      const res = await fetch(`/api/agents/${agentName}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      console.log('[FCM] Saved:', res.status);
    }
    return token || null;
  } catch (err) {
    console.error('[FCM] Error:', err.message);
    return null;
  }
}

export function onForegroundMessage(callback) {
  // Always update to latest callback (fixes React StrictMode double-render)
  activeCallback = callback;

  if (foregroundListenerRegistered) return;

  setup().then(msg => {
    if (!msg) return;
    if (foregroundListenerRegistered) return;
    foregroundListenerRegistered = true;
    onMessage(msg, (payload) => {
      const data = payload.data || {};
      const title = data.title || payload.notification?.title || 'New Notification';
      const body = data.body || payload.notification?.body || '';
      console.log('[FCM] 📨 Message received:', title, '| assignedTo:', data.assignedTo);
      if (activeCallback) activeCallback({ title, body, data });
    });
    console.log('[FCM] onMessage listener registered ✅');
  });
}
