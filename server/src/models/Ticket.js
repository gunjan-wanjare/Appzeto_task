const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const historySchema = new mongoose.Schema({
  action: { type: String, required: true },
  detail: { type: String },
  at: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 5, maxlength: 100 },
    description: { type: String, required: true, minlength: 20 },
    category: {
      type: String,
      required: true,
      enum: ['Bug', 'Feature', 'Billing', 'Other'],
    },
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'],
      default: 'Open',
    },
    version: { type: Number, default: 1 },
    assignedAgent: { type: String, default: null },
    slaDeadline: { type: Date },
    priorityBumped: { type: Boolean, default: false },
    comments: [commentSchema],
    history: [historySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
