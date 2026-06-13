const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  maxLoad: { type: Number, required: true },
  activeTickets: { type: Number, default: 0 },
  fcmToken: { type: String, default: null },
});

module.exports = mongoose.model('Agent', agentSchema);
