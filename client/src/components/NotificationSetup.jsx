import { useState, useEffect } from 'react';
import axios from 'axios';
import { requestNotificationPermission } from '../firebase.js';
import Toast from './Toast.jsx';

export default function NotificationSetup() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(() => localStorage.getItem('helpdesk_agent') || '');
  const [status, setStatus] = useState('idle');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    axios.get('/api/agents')
      .then(res => setAgents(res.data.map(a => a.name)))
      .catch(() => {});
  }, []);

  // Auto-restore token if permission already granted
  useEffect(() => {
    if (!selectedAgent) return;
    if (Notification.permission === 'granted') {
      setStatus('requesting');
      requestNotificationPermission(selectedAgent).then(token => {
        setStatus(token ? 'granted' : 'idle');
      });
    }
  }, [selectedAgent]);

  async function handleEnable() {
    if (!selectedAgent) return;
    setStatus('requesting');
    localStorage.setItem('helpdesk_agent', selectedAgent);
    const token = await requestNotificationPermission(selectedAgent);
    if (token) {
      setStatus('granted');
      setToast({ message: `Notifications enabled for ${selectedAgent}`, type: 'success' });
    } else {
      setStatus('denied');
      setToast({ message: 'Notification permission denied', type: 'error' });
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={selectedAgent}
          onChange={e => { setSelectedAgent(e.target.value); localStorage.setItem('helpdesk_agent', e.target.value); setStatus('idle'); }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">I am…</option>
          {agents.map(a => <option key={a}>{a}</option>)}
        </select>

        {status === 'granted' ? (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span>🔔</span> Notifications on
          </span>
        ) : (
          <button
            onClick={handleEnable}
            disabled={!selectedAgent || status === 'requesting'}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {status === 'requesting' ? 'Enabling…' : 'Enable Notifications'}
          </button>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </>
  );
}
