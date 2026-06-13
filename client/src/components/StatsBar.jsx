const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
  Queued: 'bg-orange-100 text-orange-700',
};

const PRIORITY_COLORS = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
};

export default function StatsBar({ stats }) {
  if (!stats) return <div className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse mb-6" />;

  const statuses = ['Open', 'In Progress', 'Queued', 'Resolved', 'Closed'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  const byStatus = Object.fromEntries(stats.byStatus.map(s => [s._id, s.count]));
  const byPriority = Object.fromEntries(stats.byPriority.map(p => [p._id, p.count]));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">By Status</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map(s => (
              <span key={s} className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[s] || 'bg-gray-100 text-gray-600'}`}>
                {s}: {byStatus[s] || 0}
              </span>
            ))}
          </div>
        </div>
        <div className="border-l border-gray-200 pl-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">By Priority</p>
          <div className="flex flex-wrap gap-2">
            {priorities.map(p => (
              <span key={p} className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[p] || 'bg-gray-100 text-gray-600'}`}>
                {p}: {byPriority[p] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
