const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');

// GET /api/agents — list all agents
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.find({}, 'name maxLoad activeTickets').sort({ name: 1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents — create a new agent
router.post('/', async (req, res) => {
  try {
    const { name, maxLoad } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    if (!maxLoad || isNaN(maxLoad) || Number(maxLoad) < 1) return res.status(400).json({ error: 'maxLoad must be a positive number' });
    const exists = await Agent.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ error: `Agent "${name}" already exists` });
    const agent = await Agent.create({ name: name.trim(), maxLoad: Number(maxLoad) });
    res.status(201).json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/:name/token — register FCM token
router.post('/:name/token', async (req, res) => {
  try {
    const agent = await Agent.findOne({ name: req.params.name });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });
    agent.fcmToken = token;
    await agent.save();
    res.json({ success: true, agent: agent.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
