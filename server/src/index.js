require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const ticketRoutes = require('./routes/tickets');
const agentRoutes = require('./routes/agents');
const { initFirebase } = require('./firebase');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use('/api/agents', agentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

connectDB()
  .then(() => {
    initFirebase();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
