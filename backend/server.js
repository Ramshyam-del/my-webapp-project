require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4001;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Import security configurations
const { 
  securityConfig, 
  validatePassword, 
  validateEmail, 
  hashPassword, 
  comparePassword,
  sanitizeObject 
} = require('./config/security');

// Import middleware
const {
  authenticateToken,
  requireAdmin,
  requireVIPLevel,
  authRateLimit,
  validateInput,
  csrfProtection,
  securityHeaders,
  requestLogger,
  errorHandler
} = require('./middleware/auth');

// Import utilities
const { sendOtp } = require('./utils/sendOtp');

// Apply security middleware
app.use(securityHeaders);
app.use(requestLogger);
// Simplified helmet for development
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development
}));

// CORS configuration - simplified for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser with size limits
app.use(express.json({ limit: securityConfig.api.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: securityConfig.api.maxRequestSize }));

// Rate limiting
const limiter = rateLimit(securityConfig.rateLimit);
app.use(limiter);

// TODO: Replace MongoDB connection with Supabase client initialization
// const MONGODB_URI = process.env.MONGO_URI;
// const mongooseOptions = {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverSelectionTimeoutMS: 5000,
//   socketTimeoutMS: 45000,
//   family: 4,
// };
// mongoose.connect(MONGODB_URI, mongooseOptions)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => {
//     console.error('MongoDB connection error:', err);
//     console.log('Server will continue without database connection');
//   });
// const db = mongoose.connection;
// db.on('error', err => {
//   console.error('MongoDB connection error:', err);
// });
// db.once('open', () => {
//   console.log('Connected to MongoDB');
// });

// Secure admin configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@quantex.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(32).toString('hex');

// In-memory storage for demo (replace with Supabase later)
const users = [];

// Generate secure admin token
const adminToken = jwt.sign(
  { 
    email: ADMIN_EMAIL, 
    role: 'admin',
    id: 'admin',
    vipLevel: 'VIP3'
  }, 
  securityConfig.jwt.secret,
  { expiresIn: securityConfig.jwt.expiresIn }
);

// Remove old requireAdminAuth function - replaced by middleware

// Basic API routes for testing
app.get('/', (req, res) => {
  res.json({ message: 'Quantex Backend API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes with enhanced security
app.post('/api/register', 
  authRateLimit,
  validateInput({
    email: validateEmail,
    password: validatePassword
  }),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password with enhanced security
      const hashedPassword = await hashPassword(password);
    
      // Create user with enhanced security
      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        role: 'user',
        vipLevel: 'VIP0',
        createdAt: new Date(),
        isVerified: false,
        lastLogin: null,
        failedLoginAttempts: 0,
        accountLocked: false,
        lockUntil: null
      };

      users.push(newUser);

      // Generate JWT token with enhanced security
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role,
          vipLevel: newUser.vipLevel
        }, 
        securityConfig.jwt.secret,
        { expiresIn: securityConfig.jwt.expiresIn }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          vipLevel: newUser.vipLevel
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

app.post('/api/login', 
  authRateLimit,
  validateInput({
    email: validateEmail,
    password: (password) => ({ valid: password && password.length > 0, message: 'Password is required' })
  }),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.accountLocked && user.lockUntil && new Date() < user.lockUntil) {
        return res.status(423).json({ 
          error: 'Account is temporarily locked',
          code: 'ACCOUNT_LOCKED',
          lockUntil: user.lockUntil
        });
      }

      // Check password with enhanced security
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        // Increment failed login attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.accountLocked = true;
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          remainingAttempts: 5 - user.failedLoginAttempts
        });
      }

      // Reset failed login attempts on successful login
      user.failedLoginAttempts = 0;
      user.accountLocked = false;
      user.lockUntil = null;
      user.lastLogin = new Date();

      // Generate JWT token with enhanced security
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          vipLevel: user.vipLevel
        }, 
        securityConfig.jwt.secret,
        { expiresIn: securityConfig.jwt.expiresIn }
      );
      
      res.json({ 
        message: 'Login successful',
        token,
        user: { 
          id: user.id,
          email: user.email, 
          role: user.role,
          vipLevel: user.vipLevel
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET);
      res.json({ 
        message: 'Admin login successful',
        token,
        user: { email, role: 'admin' }
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User management routes
app.get('/api/users', requireAdmin, (req, res) => {
  const userList = users.map(user => ({
    _id: user.id,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    // Add mock data for admin panel
    invitationCode: 'INV' + Math.random().toString(36).substr(2, 6),
    vipLevel: 'VIP0',
    balanceStatus: 'Normal',
    creditScore: 100,
    realNameAuth: 'uncertified',
    totalAssets: 0,
    totalRecharge: 0,
    totalWithdrawal: 0,
    superiorAccount: '',
    registered: user.createdAt.toISOString().split('T')[0],
    withdrawalStatus: true,
    transactionStatus: true,
    accountStatus: true
  }));
  
  res.json(userList);
});

// Trading API routes
app.get('/api/trading/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Mock data for development
    const mockPrices = {
      'BTCUSDT': { price: 45000 + Math.random() * 5000, change: 2.5 + Math.random() * 10 - 5 },
      'ETHUSDT': { price: 2800 + Math.random() * 500, change: 1.8 + Math.random() * 8 - 4 },
      'BNBUSDT': { price: 320 + Math.random() * 50, change: 0.5 + Math.random() * 6 - 3 },
      'SOLUSDT': { price: 120 + Math.random() * 30, change: 3.2 + Math.random() * 12 - 6 },
      'ADAUSDT': { price: 0.45 + Math.random() * 0.1, change: 1.1 + Math.random() * 4 - 2 }
    };
    
    const mockData = mockPrices[symbol] || { 
      price: 100 + Math.random() * 100, 
      change: Math.random() * 10 - 5 
    };
    
    res.json({
      symbol: symbol,
      price: mockData.price.toFixed(2),
      priceChange: (mockData.price * mockData.change / 100).toFixed(2),
      priceChangePercent: mockData.change.toFixed(2),
      volume: (Math.random() * 1000000).toFixed(2),
      high24h: (mockData.price * 1.05).toFixed(2),
      low24h: (mockData.price * 0.95).toFixed(2)
    });
    
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/trading/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000);
    });
    
    const fetchPromise = fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (response.ok) {
      const data = await response.json();
      
      const asks = data.asks.map(([price, quantity]) => ({
        price: parseFloat(price),
        amount: parseFloat(quantity)
      }));

      const bids = data.bids.map(([price, quantity]) => ({
        price: parseFloat(price),
        amount: parseFloat(quantity)
      }));

      res.json({ asks, bids });
    } else {
      res.status(500).json({ error: 'Failed to fetch order book' });
    }
  } catch (error) {
    console.error('Order book fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Place order endpoint (simulated for now)
app.post('/api/trading/order', async (req, res) => {
  try {
    const { symbol, side, type, quantity, price, timeInForce = 'GTC' } = req.body;

    // Validate required fields
    if (!symbol || !side || !type || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate order parameters
    if (parseFloat(quantity) <= 0 || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Invalid quantity or price' });
    }

    // Simulate order placement (in real implementation, this would call Binance API)
    const orderId = Math.floor(Math.random() * 1000000);
    const timestamp = new Date().toISOString();

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      orderId,
      symbol,
      side,
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      status: 'FILLED',
      timestamp,
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get account information
app.get('/api/trading/account', async (req, res) => {
  try {
    // Simulate account data (in real implementation, this would fetch from Binance)
    const accountInfo = {
      makerCommission: 15,
      takerCommission: 15,
      buyerCommission: 0,
      sellerCommission: 0,
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      updateTime: 0,
      accountType: 'SPOT',
      balances: [
        {
          asset: 'BTC',
          free: '0.00000000',
          locked: '0.00000000'
        },
        {
          asset: 'USDT',
          free: '1000.00000000',
          locked: '0.00000000'
        }
      ]
    };

    res.json(accountInfo);
  } catch (error) {
    console.error('Account info error:', error);
    res.status(500).json({ error: 'Failed to fetch account information' });
  }
});

// Get open orders
app.get('/api/trading/open-orders', async (req, res) => {
  try {
    // Simulate open orders (in real implementation, this would fetch from Binance)
    const openOrders = [
      {
        symbol: 'BTCUSDT',
        orderId: 123456,
        orderListId: -1,
        clientOrderId: 'abc123',
        price: '50000.00',
        origQty: '0.001',
        executedQty: '0.000',
        cummulativeQuoteQty: '0.000',
        status: 'NEW',
        timeInForce: 'GTC',
        type: 'LIMIT',
        side: 'BUY',
        stopPrice: '0.00',
        icebergQty: '0.000',
        time: 1640995200000,
        updateTime: 1640995200000,
        isWorking: true,
        origQuoteOrderQty: '0.000'
      }
    ];

    res.json(openOrders);
  } catch (error) {
    console.error('Open orders error:', error);
    res.status(500).json({ error: 'Failed to fetch open orders' });
  }
});

// Cancel order
app.delete('/api/trading/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Simulate order cancellation
    await new Promise(resolve => setTimeout(resolve, 500));

    res.json({
      orderId: parseInt(orderId),
      symbol,
      status: 'CANCELED',
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get trading history
app.get('/api/trading/history', async (req, res) => {
  try {
    const { symbol, limit = 10 } = req.query;

    // Simulate trading history
    const trades = [
      {
        id: 123456,
        orderId: 123456,
        orderListId: -1,
        price: '50000.00',
        qty: '0.001',
        quoteQty: '50.00',
        commission: '0.075',
        commissionAsset: 'USDT',
        time: 1640995200000,
        isBuyer: true,
        isMaker: false,
        isBestMatch: false
      }
    ];

    res.json(trades);
  } catch (error) {
    console.error('Trading history error:', error);
    res.status(500).json({ error: 'Failed to fetch trading history' });
  }
});

// Apply error handling middleware
app.use(errorHandler);

// 👇 Final fixed listen block
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Quantex Backend Server running on port ${PORT}`);
  console.log(`🔒 Security features enabled:`);
  console.log(`   - Rate limiting: ${securityConfig.rateLimit.max} requests per ${securityConfig.rateLimit.windowMs/1000}s`);
  console.log(`   - Auth rate limiting: ${securityConfig.authRateLimit.max} attempts per ${securityConfig.authRateLimit.windowMs/1000}s`);
  console.log(`   - JWT expiration: ${securityConfig.jwt.expiresIn}`);
  console.log(`   - Password rounds: ${securityConfig.password.bcryptRounds}`);
});
