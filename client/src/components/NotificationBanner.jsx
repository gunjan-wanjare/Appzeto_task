import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBanner({ notification, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 6000);
      return () => clearTimeout(t);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  function handleClick() {
    setVisible(false);
    if (notification.data?.ticketId) navigate(`/tickets/${notification.data.ticketId}`);
    setTimeout(onDismiss, 300);
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex justify-center transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div
        onClick={handleClick}
        className="mx-4 mt-2 bg-indigo-600 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 cursor-pointer hover:bg-indigo-700 transition-colors max-w-lg w-full"
      >
        <span className="text-2xl">🎫</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-xs text-indigo-200 truncate">{notification.body}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 300); }}
          className="text-white/70 hover:text-white text-xl leading-none shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}
