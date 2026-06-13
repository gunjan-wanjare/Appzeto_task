import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { fetchTicket, patchTicket, addComment } from '../api.js';
import Toast from '../components/Toast.jsx';
import ConflictModal from '../components/ConflictModal.jsx';

const VALID_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['In Progress', 'Closed'],
  Closed: [],
  Queued: ['Open', 'In Progress'],
};

const PRIORITY_COLORS = {
  Critical: 'text-red-600 bg-red-50 border-red-200',
  High: 'text-orange-600 bg-orange-50 border-orange-200',
  Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  Low: 'text-green-600 bg-green-50 border-green-200',
};

const SLA_COLORS = { ok: 'text-green-600', at_risk: 'text-yellow-600', breached: 'text-red-600' };
const SLA_BG = { ok: 'bg-green-50 border-green-200', at_risk: 'bg-yellow-50 border-yellow-200', breached: 'bg-red-50 border-red-200' };

function SlaCountdown({ deadline, slaState }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Breached'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span className={`text-sm font-mono font-semibold ${SLA_COLORS[slaState]}`}>{remaining}</span>
  );
}

export default function DetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      const res = await fetchTicket(id);
      // Don't overwrite if conflict modal is open
      setTicket(prev => {
        if (!prev) return res.data;
        // If version changed and no modal open, silently update
        return res.data;
      });
    } catch (err) {
      if (!silent) setError(err.response?.data?.error || 'Failed to load ticket');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(false); }, [load]);

  // Poll detail page every 10s (silent — don't flash UI)
  useEffect(() => {
    const id = setInterval(() => {
      // Skip silent poll if conflict modal is open
      setConflict(c => { if (!c) load(true); return c; });
    }, 10000);
    return () => clearInterval(id);
  }, [load]);

  async function handleStatusChange(newStatus) {
    if (!ticket) return;
    const prev = { ...ticket };
    // Optimistic update
    setTicket(t => ({ ...t, status: newStatus }));

    try {
      const res = await patchTicket(id, { status: newStatus, version: ticket.version });
      setTicket(res.data);
      setToast({ message: `Status updated to "${newStatus}"`, type: 'success' });
    } catch (err) {
      if (err.response?.status === 409) {
        setTicket(prev); // rollback
        setConflict({ serverState: err.response.data.current });
        setPendingChange({ status: newStatus });
      } else {
        setTicket(prev); // rollback
        const msg = err.response?.data?.error || 'Failed to update status';
        setToast({ message: msg, type: 'error' });
      }
    }
  }

  async function handleTakeTheirs() {
    setTicket(conflict.serverState);
    setConflict(null);
    setPendingChange(null);
    setToast({ message: 'Accepted server state', type: 'info' });
  }

  async function handleRetryMine() {
    const change = pendingChange;
    const serverState = conflict.serverState;
    setConflict(null);
    setPendingChange(null);
    // Retry with server's current version
    const prev = ticket;
    setTicket(t => ({ ...t, status: change.status }));
    try {
      const res = await patchTicket(id, { status: change.status, version: serverState.version });
      setTicket(res.data);
      setToast({ message: `Status updated to "${change.status}"`, type: 'success' });
    } catch (err) {
      setTicket(prev);
      const msg = err.response?.data?.error || 'Retry failed';
      setToast({ message: msg, type: 'error' });
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (comment.trim().length < 3) { setCommentError('Comment must be at least 3 characters'); return; }
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await addComment(id, comment.trim());
      setTicket(res.data);
      setComment('');
      setToast({ message: 'Comment added', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add comment';
      setCommentError(msg);
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      <Link to="/" className="mt-4 inline-block text-indigo-600 text-sm">← Back to list</Link>
    </div>
  );

  if (!ticket) return null;

  const allowedTransitions = VALID_TRANSITIONS[ticket.status] || [];
  const slaState = ticket.slaState || 'ok';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 truncate">{ticket.title}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{ticket.title}</h1>
          <span className={`shrink-0 px-3 py-1 rounded-lg border text-sm font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority}
          </span>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-5">{ticket.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Info label="Category" value={ticket.category} />
          <Info label="Assigned To" value={ticket.assignedAgent || 'Unassigned'} />
          <Info label="Created" value={formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })} />
          <Info label="Version" value={`v${ticket.version}`} />
        </div>
      </div>

      {/* SLA */}
      <div className={`rounded-xl border p-4 mb-4 ${SLA_BG[slaState]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">SLA Status</p>
            <span className={`text-sm font-semibold capitalize ${SLA_COLORS[slaState]}`}>{slaState.replace('_', ' ')}</span>
          </div>
          {ticket.slaDeadline && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Time remaining</p>
              <SlaCountdown deadline={ticket.slaDeadline} slaState={slaState} />
            </div>
          )}
        </div>
      </div>

      {/* Status control */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
            Current: {ticket.status}
          </span>
          {allowedTransitions.length === 0 ? (
            <span className="text-sm text-gray-400 italic">No transitions available</span>
          ) : (
            allowedTransitions.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                → {s}
              </button>
            ))
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-4">History</p>
        {ticket.history.length === 0 ? (
          <p className="text-sm text-gray-400">No history yet</p>
        ) : (
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {ticket.history.map((h, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-1.5 mt-1 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white" />
                <p className="text-sm font-medium text-gray-800">{h.action}</p>
                {h.detail && <p className="text-xs text-gray-500">{h.detail}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{h.at ? format(new Date(h.at), 'MMM d, yyyy HH:mm') : ''}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-sm font-semibold text-gray-900 mb-4">
          Comments ({ticket.comments.length})
        </p>

        {ticket.comments.length > 0 && (
          <div className="space-y-3 mb-5">
            {ticket.comments.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-800">{c.text}</p>
                <p className="text-xs text-gray-400 mt-1">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy HH:mm') : ''}</p>
              </div>
            ))}
          </div>
        )}

        {ticket.status === 'Closed' ? (
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 text-center">
            Comments are disabled for Closed tickets
          </div>
        ) : (
          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              value={comment}
              onChange={e => { setComment(e.target.value); setCommentError(''); }}
              rows={3}
              placeholder="Add a comment (min 3 characters)…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${commentError ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            {commentError && <p className="text-xs text-red-600">{commentError}</p>}
            <button
              type="submit"
              disabled={commentSubmitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {commentSubmitting ? 'Posting…' : 'Add Comment'}
            </button>
          </form>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {conflict && (
        <ConflictModal
          myChange={pendingChange}
          serverState={conflict.serverState}
          onTakeTheirs={handleTakeTheirs}
          onRetryMine={handleRetryMine}
          onClose={() => { setConflict(null); setPendingChange(null); }}
        />
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-medium text-gray-800 text-sm">{value}</p>
    </div>
  );
}
