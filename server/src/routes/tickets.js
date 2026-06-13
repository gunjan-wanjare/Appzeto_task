const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const { computeSlaDeadline, computeSlaState, bumpPriority } = require('../utils/sla');
const { assignTicket, freeAgentAndReassign } = require('../utils/assignment');

const VALID_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['In Progress', 'Closed'],
  Closed: [],
  Queued: ['Open', 'In Progress'],
};

function enrichTicket(ticket) {
  const obj = ticket.toObject ? ticket.toObject() : { ...ticket };
  obj.slaState = computeSlaState(ticket);
  return obj;
}

async function applySlaBump(ticket) {
  const state = computeSlaState(ticket);
  if (
    state === 'breached' &&
    !ticket.priorityBumped &&
    (ticket.status === 'Open' || ticket.status === 'In Progress')
  ) {
    const newPriority = bumpPriority(ticket.priority);
    if (newPriority !== ticket.priority) {
      const old = ticket.priority;
      ticket.priority = newPriority;
      ticket.priorityBumped = true;
      ticket.version += 1;
      ticket.history.push({
        action: 'Priority Bumped',
        detail: `SLA breached — priority escalated from ${old} to ${newPriority}`,
      });
      await ticket.save();
    }
  }
}

// GET /api/tickets/stats — single aggregation pipeline using $facet
router.get('/stats', async (req, res) => {
  try {
    const [result] = await Ticket.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        },
      },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, sort = 'newest', page = 1, limit = 6 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const PRIORITY_SORT_VAL = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    let sortObj = {};
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'priority') sortObj = { _priorityVal: -1, createdAt: -1 };
    else sortObj = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    // For priority sort use aggregation so pagination is correct across full result set
    let tickets;
    if (sort === 'priority') {
      const pipeline = [
        { $match: filter },
        { $addFields: { _priorityVal: { $switch: { branches: [
          { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
          { case: { $eq: ['$priority', 'High'] }, then: 3 },
          { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
          { case: { $eq: ['$priority', 'Low'] }, then: 1 },
        ], default: 0 } } } },
        { $sort: { _priorityVal: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
      ];
      const raw = await Ticket.aggregate(pipeline);
      tickets = raw.map(t => new Ticket(t));
    } else {
      tickets = await Ticket.find(filter).sort(sortObj).skip(skip).limit(Number(limit));
    }

    const total = await Ticket.countDocuments(filter);

    // Apply SLA bumps and enrich
    const enriched = [];
    for (const t of tickets) {
      await applySlaBump(t);
      enriched.push(enrichTicket(t));
    }

    res.json({ tickets: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('category').isIn(['Bug', 'Feature', 'Billing', 'Other']).withMessage('Invalid category'),
    body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, description, category, priority } = req.body;
      const ticket = new Ticket({
        title,
        description,
        category,
        priority,
        status: 'Open',
        version: 1,
        history: [{ action: 'Created', detail: `Ticket created with priority ${priority}` }],
      });
      ticket.slaDeadline = computeSlaDeadline(priority, new Date());
      await assignTicket(ticket);
      await ticket.save();
      res.status(201).json(enrichTicket(ticket));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    await applySlaBump(ticket);
    res.json(enrichTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id
router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { version, status } = req.body;

    // Optimistic locking
    if (version !== undefined && Number(version) !== ticket.version) {
      return res.status(409).json({
        error: 'Conflict: ticket was modified by someone else',
        current: enrichTicket(ticket),
      });
    }

    if (status) {
      const allowed = VALID_TRANSITIONS[ticket.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid transition: ${ticket.status} → ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        });
      }
      const prevAgent = ticket.assignedAgent;
      const prevStatus = ticket.status;
      ticket.status = status;
      ticket.history.push({ action: 'Status Changed', detail: `${prevStatus} → ${status}` });

      if (status === 'Resolved' || status === 'Closed') {
        ticket.version += 1;
        await ticket.save();
        await freeAgentAndReassign(prevAgent);
        const updated = await Ticket.findById(ticket._id);
        return res.json(enrichTicket(updated));
      }
    }

    ticket.version += 1;
    await ticket.save();
    res.json(enrichTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.status === 'Closed') {
      return res.status(400).json({ error: 'Cannot add comments to a Closed ticket' });
    }
    const { text } = req.body;
    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: 'Comment must be at least 3 characters' });
    }
    ticket.comments.push({ text: text.trim() });
    ticket.version += 1;
    await ticket.save();
    res.status(201).json(enrichTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
