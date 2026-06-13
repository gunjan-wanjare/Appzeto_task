import { useState, useEffect, useRef } from 'react';
import useTickets from '../hooks/useTickets.js';
import StatsBar from '../components/StatsBar.jsx';
import TicketCard from '../components/TicketCard.jsx';
import Toast from '../components/Toast.jsx';

const STATUSES = ['', 'Open', 'In Progress', 'Queued', 'Resolved', 'Closed'];
const PRIORITIES = ['', 'Critical', 'High', 'Medium', 'Low'];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Priority' },
];

export default function ListPage() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const filters = { status, priority, search: debouncedSearch, sort, page, limit: 6 };
  const { tickets, stats, total, pages, loading, error, updateCount, dismissToast } = useTickets(filters);

  function handleFilterChange(setter) {
    return (e) => { setter(e.target.value); setPage(1); };
  }

  return (
    <div>
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tickets…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select value={status} onChange={handleFilterChange(setStatus)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={handleFilterChange(setPriority)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Priorities</option>
          {PRIORITIES.filter(Boolean).map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={sort} onChange={handleFilterChange(setSort)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{total} ticket{total !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-medium">No tickets found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map(t => <TicketCard key={t._id} ticket={t} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button
            disabled={page === pages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {updateCount > 0 && (
        <Toast
          message={`${updateCount} ticket${updateCount > 1 ? 's' : ''} updated`}
          type="info"
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
