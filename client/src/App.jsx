import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ListPage from './pages/ListPage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import Navbar from './components/Navbar.jsx';
import NotificationBanner from './components/NotificationBanner.jsx';
import { onForegroundMessage } from './firebase.js';

export default function App() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    onForegroundMessage((msg) => {
      const currentAgent = localStorage.getItem('helpdesk_agent');
      const assignedTo = msg.data?.assignedTo;
      console.log('[Notification] assignedTo:', assignedTo, '| currentAgent:', currentAgent);

      if (!assignedTo || !currentAgent || assignedTo === currentAgent) {
        // Show native OS desktop notification
        if (Notification.permission === 'granted') {
          const n = new Notification(msg.title, {
            body: msg.body,
            icon: '/favicon.ico',
            tag: msg.data?.ticketId || 'helpdesk',
          });
          n.onclick = () => {
            window.focus();
            if (msg.data?.ticketId) {
              window.location.href = `/tickets/${msg.data.ticketId}`;
            }
            n.close();
          };
        }
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NotificationBanner notification={banner} onDismiss={() => setBanner(null)} />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/tickets/new" element={<CreatePage />} />
            <Route path="/tickets/:id" element={<DetailPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
