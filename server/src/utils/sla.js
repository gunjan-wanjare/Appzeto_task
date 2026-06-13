const SLA_HOURS = { Critical: 2, High: 8, Medium: 24, Low: 72 };

const PRIORITY_ORDER = ['Low', 'Medium', 'High', 'Critical'];

function computeSlaDeadline(priority, createdAt) {
  const hours = SLA_HOURS[priority] || 72;
  return new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000);
}

function computeSlaState(ticket) {
  const deadline = ticket.slaDeadline;
  if (!deadline) return 'ok';
  const now = Date.now();
  const created = new Date(ticket.createdAt).getTime();
  const total = deadline.getTime() - created;
  const elapsed = now - created;
  if (now >= deadline.getTime()) return 'breached';
  if (elapsed / total >= 0.75) return 'at_risk';
  return 'ok';
}

function bumpPriority(priority) {
  const idx = PRIORITY_ORDER.indexOf(priority);
  if (idx < 0 || idx >= PRIORITY_ORDER.length - 1) return priority;
  return PRIORITY_ORDER[idx + 1];
}

module.exports = { computeSlaDeadline, computeSlaState, bumpPriority };
