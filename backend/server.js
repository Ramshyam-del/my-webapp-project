require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
  ['http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/adminUsers'));
app.use('/api/admin', require('./routes/adminWithdrawals'));
app.use('/api/admin', require('./routes/adminTrades'));

// 404 handler - JSON only
app.use('*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    code: 'not_found', 
    message: 'Route not found' 
  });
});

// Global error handler - JSON only
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  const status = Number(err.status || err.statusCode || 500);
  const code = err.code || 'server_error';
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  
  res.status(status).json({ ok: false, code, message });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server listening on port ${PORT}`);
  console.log(`🔐 Supabase server client ready`);
  console.log(`🌐 CORS origins: ${corsOrigins.join(', ')}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

module.exports = app;
