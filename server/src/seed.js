require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('./models/Agent');
const Ticket = require('./models/Ticket');
const { computeSlaDeadline } = require('./utils/sla');

// 3 agents as per spec — more can be added via POST /api/agents
const AGENTS = [
  { name: 'Riya', maxLoad: 3 },
  { name: 'Karan', maxLoad: 4 },
  { name: 'Dev', maxLoad: 5 },
];

function parseDate(d) {
  if (!d) return new Date();
  const parsed = new Date(d);
  if (!isNaN(parsed)) return parsed;
  // Try DD/MM/YYYY
  const match = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}`);
  return new Date();
}

function mapCategory(tags = [], title = '') {
  const t = (title + ' ' + tags.join(' ')).toLowerCase();
  if (t.includes('bug') || t.includes('fix') || t.includes('glitch') || t.includes('overlap')) return 'Bug';
  if (t.includes('api') || t.includes('perf') || t.includes('optim') || t.includes('compress')) return 'Feature';
  if (t.includes('client') || t.includes('invoice') || t.includes('payment') || t.includes('checkout') || t.includes('razorpay')) return 'Billing';
  return 'Other';
}

function mapPriority(p) {
  if (p === 'Critical') return 'Critical';
  if (p === 'High') return 'High';
  if (p === 'Medium') return 'Medium';
  return 'Low';
}

function mapStatus(s) {
  const map = {
    'In Progress': 'In Progress',
    'Done': 'Resolved',
    'Review': 'In Progress',
    'Backlog': 'Open',
    'QA-Hold': 'In Progress',
    'Pending Client': 'Open',
  };
  return map[s] || 'Open';
}

const RAW_TICKETS = [
  { id: 'T-104', title: 'Add OTP login flow', status: 'In Progress', estimateHours: 5, createdDate: '26/04/2026', priority: 'High', tags: ['ui', 'bug'] },
  { id: 'T-110', title: 'Migrate to Vite build system', status: 'In Progress', estimateHours: 12, createdDate: '04/05/2026', priority: 'Medium', tags: ['bug'] },
  { id: 'T-118', title: 'Compress hero video assets for performance', status: 'Review', estimateHours: 3, createdDate: '22/04/2026', priority: 'Low', tags: ['client', 'perf'] },
  { id: 'T-124', title: 'Fix notification badge count not updating', status: 'In Progress', estimateHours: 12, createdDate: '29/05/2026', priority: 'High', tags: ['perf', 'ui', 'design'] },
  { id: 'T-136', title: 'Rebuild FAQ accordion component', status: 'In Progress', estimateHours: 10, createdDate: '30/05/2026', priority: 'High', tags: ['design'] },
  { id: 'T-137', title: 'Add rate limiter on login endpoint', status: 'Backlog', estimateHours: 4, createdDate: '31/05/2026', priority: 'High', tags: ['bug', 'ui'] },
  { id: 'T-116', title: 'Add skeleton loaders to dashboard', status: 'Backlog', estimateHours: 6, createdDate: '09/05/2026', priority: 'High', tags: ['ui', 'design', 'client'] },
  { id: 'T-132', title: 'Build sitemap generator tool', status: 'In Progress', estimateHours: 12, createdDate: '05/06/2026', priority: 'Medium', tags: ['design', 'perf', 'ui'] },
  { id: 'T-105', title: 'Refactor product card component for reuse', status: 'Review', estimateHours: 12, createdDate: '16/04/2026', priority: 'Medium', tags: ['perf'] },
  { id: 'T-102', title: 'Integrate Razorpay checkout payment gateway', status: 'Backlog', estimateHours: 2, createdDate: '23/04/2026', priority: 'High', tags: ['perf'] },
  { id: 'T-134', title: 'Fix checkout address form validation errors', status: 'QA-Hold', estimateHours: 5, createdDate: '05/05/2026', priority: 'High', tags: ['design', 'bug', 'client'] },
  { id: 'T-106', title: 'Write API error logger middleware', status: 'Review', estimateHours: 5, createdDate: '22/05/2026', priority: 'High', tags: ['api', 'bug', 'ui'] },
  { id: 'T-119', title: 'Clean up form validation across all forms', status: 'Backlog', estimateHours: 5, createdDate: '25/05/2026', priority: 'High', tags: ['design'] },
  { id: 'T-114', title: 'Invoice PDF export feature for billing', status: 'In Progress', estimateHours: 2, createdDate: '02/06/2026', priority: 'Medium', tags: ['api', 'perf', 'ui'] },
  { id: 'T-125', title: 'Fix currency formatting inconsistencies', status: 'Backlog', estimateHours: 12, createdDate: '22/04/2026', priority: 'Medium', tags: ['api'] },
  { id: 'T-133', title: 'Image alt text accessibility audit', status: 'Review', estimateHours: 3, createdDate: '28/04/2026', priority: 'High', tags: ['design'] },
  { id: 'T-117', title: 'Fix date picker timezone conversion bug', status: 'Done', estimateHours: 4, createdDate: '18/04/2026', priority: 'Medium', tags: ['api', 'bug', 'client'] },
  { id: 'T-112', title: 'SEO meta tags audit and improvements', status: 'Done', estimateHours: 4, createdDate: '09/05/2026', priority: 'Low', tags: ['perf', 'ui'] },
  { id: 'T-121', title: 'Fix wishlist sync issue across devices', status: 'Backlog', estimateHours: 12, createdDate: '27/05/2026', priority: 'Medium', tags: ['ui'] },
  { id: 'T-138', title: 'Implement breadcrumb navigation component', status: 'Done', estimateHours: 3, createdDate: '18/05/2026', priority: 'Medium', tags: ['design', 'api', 'perf'] },
  { id: 'T-109', title: 'Email template redesign for client notifications', status: 'Done', estimateHours: 8, createdDate: '23/05/2026', priority: 'High', tags: ['client', 'bug'] },
  { id: 'T-111', title: 'Fix cart quantity update bug', status: 'Done', estimateHours: 6, createdDate: '01/06/2026', priority: 'Medium', tags: ['client', 'bug', 'api'] },
  { id: 'T-135', title: 'Build testimonials slider component', status: 'Backlog', estimateHours: 10, createdDate: '24/05/2026', priority: 'High', tags: ['api', 'bug'] },
  { id: 'T-107', title: 'Dark mode toggle implementation', status: 'Done', estimateHours: 6, createdDate: '16/04/2026', priority: 'Medium', tags: ['bug'] },
  { id: 'T-122', title: 'Improve search relevance algorithm', status: 'In Progress', estimateHours: 10, createdDate: '03/06/2026', priority: 'High', tags: ['design', 'ui', 'perf'] },
  { id: 'T-101', title: 'Fix navbar overlap on tablet viewport', status: 'Backlog', estimateHours: 5, createdDate: '30/04/2026', priority: 'Low', tags: ['design'] },
  { id: 'T-129', title: 'Add pagination to blog listing page', status: 'Backlog', estimateHours: 5, createdDate: '27/04/2026', priority: 'High', tags: ['ui', 'client', 'bug'] },
  { id: 'T-108', title: 'Build client dashboard charts and analytics', status: 'Done', estimateHours: 3, createdDate: '28/04/2026', priority: 'High', tags: ['design', 'api', 'perf'] },
  { id: 'T-128', title: 'Profile photo upload and storage feature', status: 'Done', estimateHours: 4, createdDate: '10/05/2026', priority: 'High', tags: ['ui'] },
  { id: 'T-126', title: 'Build order tracking page for customers', status: 'Done', estimateHours: 12, createdDate: '16/05/2026', priority: 'Low', tags: ['perf', 'client', 'api'] },
  { id: 'T-127', title: 'Implement payment retry handler for failed transactions', status: 'Review', estimateHours: 2, createdDate: '27/05/2026', priority: 'High', tags: ['perf'] },
  { id: 'T-120', title: 'Create custom 404 error page', status: 'Backlog', estimateHours: 3, createdDate: '30/04/2026', priority: 'High', tags: ['design', 'client'] },
  { id: 'T-123', title: 'Implement admin role permissions system', status: 'In Progress', estimateHours: 5, createdDate: '15/05/2026', priority: 'Low', tags: ['api', 'client'] },
  { id: 'T-130', title: 'Fix sticky header glitch on scroll', status: 'Pending Client', estimateHours: 5, createdDate: '24/05/2026', priority: 'High', tags: ['design', 'bug', 'client'] },
  { id: 'T-113', title: 'Implement lazy route loading for performance', status: 'Review', estimateHours: 8, createdDate: '02/05/2026', priority: 'High', tags: ['perf', 'bug', 'design'] },
  { id: 'T-115', title: 'Update footer links and social media icons', status: 'In Progress', estimateHours: 5, createdDate: '15/04/2026', priority: 'High', tags: ['perf', 'ui', 'bug'] },
  { id: 'T-131', title: 'Build coupon code engine for checkout', status: 'Review', estimateHours: 5, createdDate: '09/06/2026', priority: 'High', tags: ['bug', 'api', 'design'] },
  { id: 'T-103', title: 'Optimize image loading and lazy load strategy', status: 'Review', estimateHours: 10, createdDate: '02/05/2026', priority: 'Low', tags: ['ui', 'api'] },
];

function buildDescription(ticket) {
  return `[${ticket.id}] ${ticket.tags.join(', ')} — This ticket covers work on "${ticket.title}". Estimated effort: ${ticket.estimateHours}h. Original status: ${ticket.status}. Please review and address the issue accordingly, ensuring all requirements and acceptance criteria are met before marking as complete.`;
}

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appzeto-helpdesk';
  await mongoose.connect(uri);
  console.log('Connected for seeding');

  await Agent.deleteMany({});
  await Ticket.deleteMany({});

  const agents = await Agent.insertMany(AGENTS);
  console.log('Agents seeded:', agents.map(a => a.name).join(', '));

  // Track agent load for seeding
  const agentLoad = { Riya: 0, Karan: 0, Dev: 0 };
  const agentMax = { Riya: 3, Karan: 4, Dev: 5 };

  function pickAgent() {
    let best = null, bestPct = Infinity;
    for (const [name, load] of Object.entries(agentLoad)) {
      if (load >= agentMax[name]) continue;
      const pct = load / agentMax[name];
      if (pct < bestPct || (pct === bestPct && (!best || load < agentLoad[best]))) {
        bestPct = pct; best = name;
      }
    }
    return best;
  }

  const dedupedIds = new Set();
  const tickets = [];

  for (const raw of RAW_TICKETS) {
    if (dedupedIds.has(raw.id)) continue;
    dedupedIds.add(raw.id);

    const status = mapStatus(raw.status);
    const priority = mapPriority(raw.priority);
    const category = mapCategory(raw.tags, raw.title);
    const createdAt = parseDate(raw.createdDate);
    const slaDeadline = computeSlaDeadline(priority, createdAt);

    let assignedAgent = null;
    let finalStatus = status;

    if (status !== 'Resolved' && status !== 'Closed') {
      const agent = pickAgent();
      if (agent) {
        assignedAgent = agent;
        agentLoad[agent] += 1;
      } else {
        finalStatus = 'Queued';
      }
    }

    const history = [{ action: 'Created', detail: `Seeded from ${raw.id}`, at: createdAt }];
    if (assignedAgent) history.push({ action: 'Assigned', detail: `Assigned to ${assignedAgent}`, at: createdAt });
    if (finalStatus === 'Queued') history.push({ action: 'Queued', detail: 'All agents at capacity', at: createdAt });

    tickets.push({
      title: raw.title,
      description: buildDescription(raw),
      category,
      priority,
      status: finalStatus,
      version: 1,
      assignedAgent,
      slaDeadline,
      history,
      comments: [],
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Ticket.insertMany(tickets, { timestamps: false });

  // Sync agent activeTickets
  for (const [name, count] of Object.entries(agentLoad)) {
    await Agent.updateOne({ name }, { activeTickets: count });
  }

  console.log(`Seeded ${tickets.length} tickets`);
  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(err => { console.error(err); process.exit(1); });
