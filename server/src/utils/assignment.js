const Agent = require('../models/Agent');
const Ticket = require('../models/Ticket');
const { sendNotification } = require('../firebase');

async function findBestAgent() {
  const agents = await Agent.find().sort({ name: 1 });
  if (!agents.length) return null;

  let best = null;
  for (const agent of agents) {
    if (agent.activeTickets >= agent.maxLoad) continue;
    if (!best) { best = agent; continue; }
    const bestPct = best.activeTickets / best.maxLoad;
    const agentPct = agent.activeTickets / agent.maxLoad;
    if (agentPct < bestPct) { best = agent; continue; }
    if (agentPct === bestPct && agent.activeTickets < best.activeTickets) { best = agent; continue; }
  }
  return best;
}

async function assignTicket(ticket) {
  const agent = await findBestAgent();
  if (!agent) {
    ticket.status = 'Queued';
    ticket.assignedAgent = null;
    ticket.history.push({ action: 'Queued', detail: 'All agents at full capacity' });
    return;
  }

  ticket.assignedAgent = agent.name;
  ticket.status = 'Open';
  ticket.history.push({ action: 'Assigned', detail: `Assigned to ${agent.name}` });
  agent.activeTickets += 1;
  await agent.save();

  if (agent.fcmToken) {
    sendNotification({
      token: agent.fcmToken,
      title: '🎫 New Ticket Assigned',
      body: `"${ticket.title}" has been assigned to you`,
      data: { ticketId: String(ticket._id), priority: ticket.priority, assignedTo: agent.name },
    });
  }
}

async function freeAgentAndReassign(agentName) {
  if (!agentName) return;
  const agent = await Agent.findOne({ name: agentName });
  if (agent && agent.activeTickets > 0) {
    agent.activeTickets -= 1;
    await agent.save();
  }

  const queued = await Ticket.findOne({ status: 'Queued' }).sort({ createdAt: 1 });
  if (!queued) return;

  await assignTicket(queued);
  queued.version += 1;
  await queued.save();
}

module.exports = { assignTicket, freeAgentAndReassign };
