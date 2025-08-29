require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);

// Per-request logging
app.use((req, _res, next) => {
  console.log(new Date().toISOString(), '-', req.method, req.originalUrl);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Import middleware and routes
const adminApiKey = require('./middleware/adminApiKey');
const adminFundsRouter = require('./routes/adminFunds');
const adminTradeDecisionRouter = require('./routes/adminTradeDecision');
const adminTradesRouter = require('./routes/adminTrades');
const tradesRouter = require('./routes/trades');
const { startSettlementWorker } = require('./worker/settleTrades');

// Admin router with API key protection
const admin = require('express').Router();
admin.use(adminApiKey);
admin.use('/funds', adminFundsRouter);
admin.use('/trades', adminTradeDecisionRouter); // PATCH :id/decision
admin.use('/trades', adminTradesRouter);        // GET list
app.use('/api/admin', admin);

// Public user route
app.use('/api/trades', tradesRouter);

// Start worker
startSettlementWorker();

// Root endpoint
app.get('/', (req, res) => {
  res.type('text').send('Backend up. Use /api/health');
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok:false, code:'not_found', message:'Route not found', path:req.originalUrl });
});

// Error
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err?.stack || err?.message || err);
  res.status(500).json({ ok:false, code:'internal_error', message:'Internal Server Error' });
});

// Start server
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 4001);
const HOST = process.env.HOST || '0.0.0.0';

console.log(`🔧 Boot config → HOST=${HOST} PORT=${PORT}`);
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend server listening on ${HOST}:${PORT}`);
});
server.on('error', (err) => { console.error('Server error:', err); process.exit(1); });

