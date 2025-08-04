require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Configuration = require('./models/Configuration');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Security configuration
const securityConfig = {
  api: {
    maxRequestSize: '10mb'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  }
};

// Security middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// Apply middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: securityConfig.api.maxRequestSize }));
app.use(rateLimit(securityConfig.rateLimit));

// Supabase Auth middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.user_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get user profile
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        kyc_status: user.kyc_status,
        balance_btc: user.balance_btc,
        balance_eth: user.balance_eth,
        balance_usdt: user.balance_usdt,
        balance_usdc: user.balance_usdc,
        balance_pyusd: user.balance_pyusd,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const { username, first_name, last_name, phone } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        username,
        first_name,
        last_name,
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user transactions
app.get('/api/user/transactions', authenticateUser, async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    res.json({ transactions });

  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create transaction
app.post('/api/transactions', authenticateUser, async (req, res) => {
  try {
    const { type, currency, amount, status, tx_hash, wallet_address, network, fee } = req.body;

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        type,
        currency,
        amount,
        status,
        tx_hash,
        wallet_address,
        network,
        fee
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });

  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notifications
app.get('/api/user/notifications', authenticateUser, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    res.json({ notifications });

  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update notification' });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });

  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get web configuration
app.get('/api/web-config', async (req, res) => {
  try {
    const { data: config, error } = await supabase
      .from('web_config')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch web configuration' });
    }

    // Convert array to object
    const configObject = {};
    config.forEach(item => {
      configObject[item.key] = item.value;
    });

    res.json({ config: configObject });

  } catch (error) {
    console.error('Web config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update web configuration (admin only)
app.put('/api/web-config/:key', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data: config, error } = await supabase
      .from('web_config')
      .update({ 
        value, 
        updated_at: new Date().toISOString() 
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update web configuration' });
    }

    res.json({
      message: 'Web configuration updated successfully',
      config
    });

  } catch (error) {
    console.error('Web config update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For development, use a simple admin check
    // In production, you should use proper admin authentication
    if (email === 'admin@quantex.com' && password === 'admin123') {
      // Create a mock admin token
      const adminToken = 'admin_token_' + Date.now();
      
      res.json({
        success: true,
        message: 'Admin login successful',
        token: adminToken,
        user: {
          id: 'admin_user_id',
          email: email,
          role: 'admin',
          name: 'Admin User'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CoinMarketCap API configuration
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

// Real-time crypto price endpoint
app.get('/api/trading/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!COINMARKETCAP_API_KEY) {
      // Fallback to mock data if API key not set
      const mockPrices = {
        'BTCUSDT': { price: 45000 + Math.random() * 1000, change: 2.5 },
        'ETHUSDT': { price: 2800 + Math.random() * 100, change: 1.8 },
        'BNBUSDT': { price: 320 + Math.random() * 10, change: 0.9 }
      };
      const priceData = mockPrices[symbol] || { price: 100 + Math.random() * 50, change: 0.5 };
      return res.json({
        symbol,
        price: priceData.price,
        change: priceData.change,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch real data from CoinMarketCap
    const response = await fetch(
      `${COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbol}&CMC_PRO_API_KEY=${COINMARKETCAP_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Quantex-Trading-Platform'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    const cryptoData = data.data[symbol];

    if (!cryptoData) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }

    const quote = cryptoData.quote.USD;
    
    res.json({
      symbol,
      price: quote.price,
      change: quote.percent_change_24h,
      market_cap: quote.market_cap,
      volume_24h: quote.volume_24h,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price API error:', error);
    
    // Provide fallback mock data instead of error
    const mockPrices = {
      'BTCUSDT': { price: 45000 + Math.random() * 1000, change: 2.5 },
      'ETHUSDT': { price: 2800 + Math.random() * 100, change: 1.8 },
      'BNBUSDT': { price: 320 + Math.random() * 10, change: 0.9 }
    };
    
    const priceData = mockPrices[req.params.symbol] || { price: 100 + Math.random() * 50, change: 0.5 };
    
    res.json({
      symbol: req.params.symbol,
      price: priceData.price,
      change: priceData.change,
      timestamp: new Date().toISOString()
    });
  }
});

// Get top cryptocurrencies
app.get('/api/crypto/top', async (req, res) => {
  try {
    if (!COINMARKETCAP_API_KEY) {
      return res.json({
        data: [
          { symbol: 'BTC', name: 'Bitcoin', price: 45000, change: 2.5 },
          { symbol: 'ETH', name: 'Ethereum', price: 2800, change: 1.8 },
          { symbol: 'BNB', name: 'Binance Coin', price: 320, change: 0.9 }
        ]
      });
    }

    const response = await fetch(
      `${COINMARKETCAP_BASE_URL}/cryptocurrency/listings/latest?limit=20&CMC_PRO_API_KEY=${COINMARKETCAP_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Quantex-Trading-Platform'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      data: data.data.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.quote.USD.price,
        change: crypto.quote.USD.percent_change_24h,
        market_cap: crypto.quote.USD.market_cap,
        volume_24h: crypto.quote.USD.volume_24h
      }))
    });

  } catch (error) {
    console.error('Top crypto API error:', error);
    
    // Provide fallback mock data
    res.json({
      data: [
        { symbol: 'BTC', name: 'Bitcoin', price: 45000 + Math.random() * 1000, change: 2.5 },
        { symbol: 'ETH', name: 'Ethereum', price: 2800 + Math.random() * 100, change: 1.8 },
        { symbol: 'BNB', name: 'Binance Coin', price: 320 + Math.random() * 10, change: 0.9 }
      ]
    });
  }
});

// Get all top cryptocurrencies in one call
app.get('/api/crypto/top-all', async (req, res) => {
  try {
    if (!COINMARKETCAP_API_KEY) {
      return res.json({
        data: [
          { symbol: 'BTC', name: 'Bitcoin', price: 45000, change: 2.5, volume_24h: 25000000000, market_cap: 850000000000 },
          { symbol: 'ETH', name: 'Ethereum', price: 2800, change: 1.8, volume_24h: 15000000000, market_cap: 350000000000 },
          { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.0, volume_24h: 50000000000, market_cap: 95000000000 },
          { symbol: 'BNB', name: 'BNB', price: 320, change: 0.9, volume_24h: 2000000000, market_cap: 50000000000 },
          { symbol: 'SOL', name: 'Solana', price: 95, change: 3.2, volume_24h: 3000000000, market_cap: 45000000000 },
          { symbol: 'ADA', name: 'Cardano', price: 0.45, change: -1.5, volume_24h: 800000000, market_cap: 16000000000 },
          { symbol: 'DOT', name: 'Polkadot', price: 6.5, change: 2.1, volume_24h: 500000000, market_cap: 8000000000 },
          { symbol: 'DOGE', name: 'Dogecoin', price: 0.08, change: 5.2, volume_24h: 1200000000, market_cap: 12000000000 },
          { symbol: 'AVAX', name: 'Avalanche', price: 25, change: 4.8, volume_24h: 1500000000, market_cap: 10000000000 },
          { symbol: 'LINK', name: 'Chainlink', price: 12, change: 1.3, volume_24h: 600000000, market_cap: 7000000000 },
          { symbol: 'MATIC', name: 'Polygon', price: 0.75, change: 2.7, volume_24h: 400000000, market_cap: 7000000000 }
        ]
      });
    }

    // Fetch all top cryptocurrencies in one API call
    const response = await fetch(
      `${COINMARKETCAP_BASE_URL}/cryptocurrency/listings/latest?limit=11&CMC_PRO_API_KEY=${COINMARKETCAP_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Quantex-Trading-Platform'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      data: data.data.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.quote.USD.price,
        change: crypto.quote.USD.percent_change_24h,
        volume_24h: crypto.quote.USD.volume_24h,
        market_cap: crypto.quote.USD.market_cap
      }))
    });

  } catch (error) {
    console.error('Top crypto API error:', error);
    
    // Provide fallback mock data
    res.json({
      data: [
        { symbol: 'BTC', name: 'Bitcoin', price: 45000 + Math.random() * 1000, change: 2.5, volume_24h: 25000000000, market_cap: 850000000000 },
        { symbol: 'ETH', name: 'Ethereum', price: 2800 + Math.random() * 100, change: 1.8, volume_24h: 15000000000, market_cap: 350000000000 },
        { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.0, volume_24h: 50000000000, market_cap: 95000000000 },
        { symbol: 'BNB', name: 'BNB', price: 320 + Math.random() * 10, change: 0.9, volume_24h: 2000000000, market_cap: 50000000000 },
        { symbol: 'SOL', name: 'Solana', price: 95 + Math.random() * 5, change: 3.2, volume_24h: 3000000000, market_cap: 45000000000 },
        { symbol: 'ADA', name: 'Cardano', price: 0.45 + Math.random() * 0.05, change: -1.5, volume_24h: 800000000, market_cap: 16000000000 },
        { symbol: 'DOT', name: 'Polkadot', price: 6.5 + Math.random() * 0.5, change: 2.1, volume_24h: 500000000, market_cap: 8000000000 },
        { symbol: 'DOGE', name: 'Dogecoin', price: 0.08 + Math.random() * 0.01, change: 5.2, volume_24h: 1200000000, market_cap: 12000000000 },
        { symbol: 'AVAX', name: 'Avalanche', price: 25 + Math.random() * 2, change: 4.8, volume_24h: 1500000000, market_cap: 10000000000 },
        { symbol: 'LINK', name: 'Chainlink', price: 12 + Math.random() * 1, change: 1.3, volume_24h: 600000000, market_cap: 7000000000 },
        { symbol: 'MATIC', name: 'Polygon', price: 0.75 + Math.random() * 0.1, change: 2.7, volume_24h: 400000000, market_cap: 7000000000 }
      ]
    });
  }
});

// Get cryptocurrency metadata
app.get('/api/crypto/metadata/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!COINMARKETCAP_API_KEY) {
      return res.json({
        symbol,
        name: symbol,
        description: 'Cryptocurrency data not available',
        logo: null
      });
    }

    const response = await fetch(
      `${COINMARKETCAP_BASE_URL}/cryptocurrency/info?symbol=${symbol}&CMC_PRO_API_KEY=${COINMARKETCAP_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Quantex-Trading-Platform'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    const cryptoInfo = data.data[symbol];

    if (!cryptoInfo) {
      return res.status(404).json({ error: 'Cryptocurrency not found' });
    }

    res.json({
      symbol: cryptoInfo.symbol,
      name: cryptoInfo.name,
      description: cryptoInfo.description,
      logo: cryptoInfo.logo,
      website: cryptoInfo.urls?.website?.[0],
      explorer: cryptoInfo.urls?.explorer?.[0]
    });

  } catch (error) {
    console.error('Metadata API error:', error);
    res.status(500).json({ error: 'Failed to fetch cryptocurrency metadata' });
  }
});

// Mock order book data (CoinMarketCap doesn't provide order book)
app.get('/api/trading/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Mock order book data
    const mockOrderBook = {
      asks: [
        { price: 45000 + Math.random() * 10, quantity: 0.5 + Math.random() * 2 },
        { price: 45001 + Math.random() * 10, quantity: 1.2 + Math.random() * 3 },
        { price: 45002 + Math.random() * 10, quantity: 0.8 + Math.random() * 2 }
      ],
      bids: [
        { price: 44999 - Math.random() * 10, quantity: 0.7 + Math.random() * 2 },
        { price: 44998 - Math.random() * 10, quantity: 1.5 + Math.random() * 3 },
        { price: 44997 - Math.random() * 10, quantity: 0.9 + Math.random() * 2 }
      ]
    };

    res.json({
      symbol,
      orderbook: mockOrderBook,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Order book API error:', error);
    res.status(500).json({ error: 'Failed to fetch order book data' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Debug endpoint to test Supabase connection
app.get('/debug-auth', async (req, res) => {
  try {
    res.json({
      status: 'Backend is running',
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Not set',
      port: PORT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Debug endpoint error', details: error.message });
  }
});

// Configuration API endpoints
app.get('/api/config', async (req, res) => {
  try {
    const config = await Configuration.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

app.put('/api/config', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const updatedConfig = await Configuration.updateConfig(updates);
    
    if (updatedConfig) {
      res.json(updatedConfig);
    } else {
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

app.put('/api/config/deposit-addresses', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { addresses } = req.body;
    const updatedConfig = await Configuration.updateDepositAddresses(addresses);
    
    if (updatedConfig) {
      res.json(updatedConfig);
    } else {
      res.status(500).json({ error: 'Failed to update deposit addresses' });
    }
  } catch (error) {
    console.error('Error updating deposit addresses:', error);
    res.status(500).json({ error: 'Failed to update deposit addresses' });
  }
});

// Initialize database on startup
Configuration.initializeDatabase().then(() => {
  console.log('✅ Database configuration initialized');
}).catch(error => {
  console.error('❌ Failed to initialize database configuration:', error);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Supabase connected: ${supabaseUrl ? 'Yes' : 'No'}`);
  console.log(`🔒 Security headers enabled`);
  console.log(`⏱️  Rate limiting enabled`);
  console.log(`🔐 Using Supabase Auth`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

module.exports = app;
