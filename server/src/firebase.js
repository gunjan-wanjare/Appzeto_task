const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');

let initialized = false;

function initFirebase() {
  if (initialized) return;
  try {
    const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
    if (serviceAccount.project_id === 'YOUR_PROJECT_ID') {
      console.warn('[FCM] serviceAccountKey.json not configured — notifications disabled');
      return;
    }
    initializeApp({ credential: cert(serviceAccount) });
    initialized = true;
    console.log('[FCM] Firebase Admin initialized ✅');
  } catch (err) {
    console.warn('[FCM] Firebase init failed:', err.message);
  }
}

async function sendNotification({ token, title, body, data = {} }) {
  if (!initialized) { console.warn('[FCM] Not initialized'); return; }
  if (!token) { console.warn('[FCM] No token'); return; }

  console.log('[FCM] Sending to:', token.substring(0, 20) + '...');
  try {
    const result = await getMessaging().send({
      token,
      data: {
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        title: String(title),
        body: String(body),
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          requireInteraction: false,
        },
        fcmOptions: {
          link: data.ticketId ? `/tickets/${data.ticketId}` : '/',
        },
      },
    });
    console.log('[FCM] Sent ✅', result);
  } catch (err) {
    console.error('[FCM] Failed ❌:', err.code, '-', err.message);
  }
}

module.exports = { initFirebase, sendNotification };
