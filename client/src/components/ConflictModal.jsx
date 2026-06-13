export default function ConflictModal({ myChange, serverState, onTakeTheirs, onRetryMine, onClose }) {
  if (!serverState) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Conflict Detected</h2>
          <p className="text-sm text-gray-500 mt-1">This ticket was changed by someone else while you were editing.</p>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3">Your Change</p>
            <dl className="space-y-2 text-sm">
              <Row label="Status" value={myChange?.status} />
            </dl>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">Server State</p>
            <dl className="space-y-2 text-sm">
              <Row label="Status" value={serverState.status} />
              <Row label="Priority" value={serverState.priority} />
              <Row label="Assigned" value={serverState.assignedAgent || 'None'} />
              <Row label="Version" value={serverState.version} />
            </dl>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={onTakeTheirs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Take theirs
          </button>
          <button
            onClick={onRetryMine}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Retry mine on top
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}
