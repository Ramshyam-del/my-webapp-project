require('dotenv').config();

// Load centralized configuration
const { config } = require('./config/appConfig');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const { requestMonitoring, errorMonitoring } = require('./middleware/monitoring');
const monitoringService = require('./services/monitoringService');

const app = express();
app.set('trust proxy', 1);

// Request monitoring middleware (before other middleware)
app.use(requestMonitoring);

// Per-request logging
app.use((req, _res, next) => {
  console.log(new Date().toISOString(), '-', req.method, req.originalUrl);
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow embedding for development
}));

// Rate limiting
app.use(generalLimiter);

// CORS middleware
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-session-token']
}));

// Body parsing middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.environment.nodeEnv,
    version: config.environment.version,
    server: {
      host: config.server.host,
      port: config.server.port
    }
  });
});

// Import middleware and routes
const adminApiKey = require('./middleware/adminApiKey');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin'); // Supabase-authenticated admin routes
const adminFundsRouter = require('./routes/adminFunds');
const adminTradeDecisionRouter = require('./routes/adminTradeDecision');
const adminTradesRouter = require('./routes/adminTrades');
const adminSecurityRouter = require('./routes/adminSecurity');
const userActivitiesRouter = require('./routes/userActivities');
const tradesRouter = require('./routes/trades');
const tradingRouter = require('./routes/trading');
const depositsRouter = require('./routes/deposits');
const sessionsRouter = require('./routes/sessions');
const triggerBalanceUpdateRouter = require('./routes/triggerBalanceUpdate');
const monitoringRouter = require('./routes/monitoring');
const { startSettlementWorker } = require('./worker/settleTrades');

// Admin routes with Supabase authentication (for /me, /users, etc.)
app.use('/api/admin', adminRouter);

// Admin router with API key protection (for legacy API key routes)
const adminApiKeyRoutes = require('express').Router();
adminApiKeyRoutes.use(adminApiKey);
adminApiKeyRoutes.use('/funds', adminFundsRouter);
adminApiKeyRoutes.use('/trades', adminTradeDecisionRouter); // PATCH :id/decision
adminApiKeyRoutes.use('/trades', adminTradesRouter);        // GET list
adminApiKeyRoutes.use('/security', adminSecurityRouter);    // Security monitoring
adminApiKeyRoutes.use('/user-activities', userActivitiesRouter);
app.use('/api/admin-api', adminApiKeyRoutes); // Changed to avoid conflict

// Deposits routes (includes both admin and user endpoints)
app.use('/api/deposits', depositsRouter);

// Authentication routes (public)
app.use('/api/auth', authRouter);

// Public user routes
app.use('/api/trades', tradesRouter);
app.use('/api/trading', tradingRouter);

// Session management routes
app.use('/api/sessions', sessionsRouter);

// Monitoring routes (public health check, admin metrics)
app.use('/api/monitoring', monitoringRouter);

// Internal system routes
app.use('/api', triggerBalanceUpdateRouter);

// Start worker
startSettlementWorker();

// Initialize services
const serviceManager = require('./services');
const RealTimeBalanceService = require('./services/realTimeBalanceService');
const keyRotationService = require('./services/keyRotation');
const securityMonitor = require('./services/securityMonitor');

// Root endpoint
app.get('/', (req, res) => {
  res.type('text').send('Backend up. Use /api/health');
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok:false, code:'not_found', message:'Route not found', path:req.originalUrl });
});

// Enhanced Error Handling
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorMonitoring); // Monitor errors
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

console.log(`🔧 Boot config → HOST=${HOST} PORT=${PORT} ENV=${config.environment.nodeEnv}`);
const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 Backend server listening on ${HOST}:${PORT}`);
  console.log(`🌐 Server URL: ${config.server.baseUrl}`);
  console.log(`🎯 Frontend URL: ${config.frontend.url}`);
  
  // Initialize services after server starts
  try {
    await serviceManager.initialize();
    
    // Initialize monitoring service
    monitoringService.initialize();
    console.log('✅ Monitoring service initialized');
    
    // Initialize security services
    securityMonitor.initialize();
    keyRotationService.initialize();
    
    // Initialize WebSocket service for real-time balance updates
    const realTimeBalanceService = new RealTimeBalanceService();
    realTimeBalanceService.start(server);
    
    // Store references for graceful shutdown
    app.realTimeBalanceService = realTimeBalanceService;
    app.securityMonitor = securityMonitor;
    app.keyRotationService = keyRotationService;
    app.monitoringService = monitoringService;
    
    console.log('✅ All services initialized successfully');
    console.log('📊 Monitoring endpoint: /api/monitoring/health');
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    monitoringService.recordError(error, { severity: 'critical', context: 'service_initialization' });
    process.exit(1);
  }
});
server.on('error', (err) => { console.error('Server error:', err); process.exit(1); });

