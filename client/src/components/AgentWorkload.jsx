import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AgentWorkload() {
  const [agents, setAgents] = useState([]);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', maxLoad: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await axios.get('/api/agents');
      setAgents(res.data);
    } catch (_) {}
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name required'); return; }
    if (!form.maxLoad || Number(form.maxLoad) < 1) { setError('Max load must be ≥ 1'); return; }
    setAdding(true);
    setError('');
    try {
      await axios.post('/api/agents', { name: form.name.trim(), maxLoad: Number(form.maxLoad) });
      setForm({ name: '', maxLoad: '' });
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add agent');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white transition-colors"
      >
        <span>👥</span>
        <span className="hidden sm:inline">Agents</span>
        <span className={`w-2 h-2 rounded-full ${agents.length && agents.every(a => a.activeTickets >= a.maxLoad) ? 'bg-red-400' : 'bg-green-400'}`} />
      </button>

      {open && (
        <>
          <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Agent Workload</p>
              <button
                onClick={() => { setShowAdd(s => !s); setError(''); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showAdd ? 'Cancel' : '+ Add Agent'}
              </button>
            </div>

            {/* Add Agent Form */}
            {showAdd && (
              <form onSubmit={handleAdd} className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Agent name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  placeholder="Max load (e.g. 5)"
                  min={1}
                  value={form.maxLoad}
                  onChange={e => setForm(f => ({ ...f, maxLoad: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? 'Adding…' : 'Add Agent'}
                </button>
              </form>
            )}

            {/* Agent List */}
            <div className="space-y-3">
              {agents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No agents yet</p>
              )}
              {agents.map(agent => {
                const pct = Math.round((agent.activeTickets / agent.maxLoad) * 100);
                const color = pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-orange-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-green-400';
                return (
                  <div key={agent.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{agent.name}</span>
                      <span className={`${pct >= 100 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                        {agent.activeTickets}/{agent.maxLoad}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {agents.length > 0 && agents.every(a => a.activeTickets >= a.maxLoad) && (
              <p className="text-xs text-red-600 mt-3 font-medium">⚠ All agents full — new tickets will be Queued</p>
            )}
          </div>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setShowAdd(false); setError(''); }} />
        </>
      )}
    </div>
  );
}
