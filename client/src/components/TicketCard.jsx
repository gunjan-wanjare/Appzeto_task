import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_STYLES = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

const PRIORITY_DOT = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-green-500',
};

const STATUS_STYLES = {
  Open: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-yellow-50 text-yellow-700',
  Resolved: 'bg-green-50 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
  Queued: 'bg-orange-50 text-orange-700',
};

const CATEGORY_STYLES = {
  Bug: 'bg-red-50 text-red-600',
  Feature: 'bg-purple-50 text-purple-600',
  Billing: 'bg-teal-50 text-teal-600',
  Other: 'bg-gray-50 text-gray-600',
};

const SLA_STYLES = {
  ok: 'text-green-600',
  at_risk: 'text-yellow-600',
  breached: 'text-red-600',
};

const SLA_ICONS = { ok: '✓', at_risk: '⚠', breached: '✕' };

export default function TicketCard({ ticket }) {
  const relTime = ticket.createdAt
    ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
    : '';

  return (
    <Link to={`/tickets/${ticket._id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">{ticket.title}</h3>
          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_STYLES[ticket.priority]}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT[ticket.priority]}`} />
            {ticket.priority}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_STYLES[ticket.category]}`}>
            {ticket.category}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
            {ticket.status}
          </span>
          {ticket.slaState && (
            <span className={`text-xs font-medium ${SLA_STYLES[ticket.slaState]}`}>
              {SLA_ICONS[ticket.slaState]} SLA {ticket.slaState.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{ticket.assignedAgent ? `→ ${ticket.assignedAgent}` : 'Unassigned'}</span>
          <span>{relTime}</span>
        </div>
      </div>
    </Link>
  );
}
