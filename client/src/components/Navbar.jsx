import { Link } from 'react-router-dom';
import NotificationSetup from './NotificationSetup.jsx';
import AgentWorkload from './AgentWorkload.jsx';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Appzeto Helpdesk</span>
        </Link>
        <div className="flex items-center gap-3">
          <AgentWorkload />
          <NotificationSetup />
          <Link
            to="/tickets/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
          >
            + New Ticket
          </Link>
        </div>
      </div>
    </nav>
  );
}
