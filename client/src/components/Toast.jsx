import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss?.(); }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!visible) return null;

  const colors = {
    info: 'bg-indigo-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3 max-w-sm`}>
      <span className="flex-1">{message}</span>
      <button onClick={() => { setVisible(false); onDismiss?.(); }} className="text-white/80 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}
