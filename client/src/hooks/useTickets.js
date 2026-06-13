import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTickets, fetchStats } from '../api.js';

export default function useTickets(filters) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  const prevIdsRef = useRef(new Set());
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (isPolling = false) => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetchTickets(filtersRef.current),
        fetchStats(),
      ]);
      const newTickets = ticketsRes.data.tickets;
      const newIds = new Set(newTickets.map(t => t._id + t.version));

      if (isPolling) {
        const changed = newTickets.filter(t => !prevIdsRef.current.has(t._id + t.version));
        if (changed.length > 0) setUpdateCount(changed.length);
      }

      prevIdsRef.current = newIds;
      setTickets(newTickets);
      setStats(statsRes.data);
      setTotal(ticketsRes.data.total);
      setPages(ticketsRes.data.pages);
      if (!isPolling) setLoading(false);
    } catch (err) {
      setError(err.message);
      if (!isPolling) setLoading(false);
    }
  }, []);

  // Initial load on filter change
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setLoading(true);
    prevIdsRef.current = new Set(); // reset diff tracking on filter change
    load(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  // Polling — single interval, restarts on filter change
  useEffect(() => {
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  const dismissToast = useCallback(() => setUpdateCount(0), []);

  return { tickets, stats, total, pages, loading, error, updateCount, dismissToast, reload: () => load(false) };
}
