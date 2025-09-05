/**
 * Production-ready configuration management
 * Removes hardcoded URLs and provides environment-aware defaults
 */

const getConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    // Server Configuration
    server: {
      host: process.env.HOST || '0.0.0.0',
      port: parseInt(process.env.BACKEND_PORT || process.env.PORT || '4001'),
      baseUrl: process.env.BACKEND_BASE_URL || 
               (isProduction ? 'https://api.quantex.app' : `http://localhost:${process.env.BACKEND_PORT || 4001}`)
    },
    
    // Frontend Configuration
    frontend: {
      url: process.env.FRONTEND_URL || 
           (isProduction ? 'https://quantex.app' : 'http://localhost:3000'),
      wsUrl: process.env.FRONTEND_WS_URL || 
             (isProduction ? 'wss://quantex.app' : `ws://localhost:${process.env.BACKEND_PORT || 4001}`)
    },
    
    // CORS Configuration
    cors: {
      origins: process.env.CORS_ORIGIN ? 
               process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
               (isProduction ? 
                 ['https://quantex.app', 'https://www.quantex.app'] : 
                 ['http://localhost:3000', 'http://127.0.0.1:3000']
               )
    },
    
    // External API Configuration
    externalApis: {
      binance: {
        baseUrl: 'https://api.binance.com',
        ticker24hr: '/api/v3/ticker/24hr'
      },
      coingecko: {
        baseUrl: 'https://api.coingecko.com',
        simplePrice: '/api/v3/simple/price'
      },
      etherscan: {
        baseUrl: 'https://api.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY
      },
      blockcypher: {
        baseUrl: 'https://api.blockcypher.com/v1',
        btcMain: '/btc/main'
      }
    },
    
    // Security Configuration
    security: {
      jwtSecret: process.env.JWT_SECRET,
      supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
      adminApiKey: process.env.ADMIN_API_KEY,
      encryptionKey: process.env.ENCRYPTION_KEY,
      sessionSecret: process.env.SESSION_SECRET || 'quantex-session-secret'
    },
    
    // Database Configuration
    database: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    },
    
    // Rate Limiting
    rateLimits: {
      general: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '1000')
      },
      auth: {
        windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10')
      },
      otp: {
        windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW || '600000'), // 10 minutes
        max: parseInt(process.env.OTP_RATE_LIMIT_MAX || '5')
      }
    },
    
    // Feature Flags
    features: {
      realTimeBalance: process.env.ENABLE_REAL_TIME_BALANCE !== 'false',
      emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
      smsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      debug: isDevelopment || process.env.DEBUG === 'true'
    },
    
    // Environment Info
    environment: {
      nodeEnv: process.env.NODE_ENV || 'production',
      isProduction,
      isDevelopment,
      version: process.env.npm_package_version || '1.0.0',
      buildDate: process.env.BUILD_DATE || new Date().toISOString()
    }
  };
};

// Validate required environment variables
const validateConfig = () => {
  const config = getConfig();
  const required = [
    'database.supabaseUrl',
    'database.supabaseServiceKey',
    'security.jwtSecret',
    'security.supabaseJwtSecret',
    'security.adminApiKey'
  ];
  
  const missing = [];
  
  required.forEach(path => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      missing.push(path);
    }
  });
  
  if (missing.length > 0) {
    console.error('\ud83d\udea8 CRITICAL: Missing required environment variables:');
    missing.forEach(path => {
      const envVar = path.split('.').map(s => s.toUpperCase()).join('_');
      console.error(`   - ${envVar}`);
    });
    console.error('\nPlease check your environment configuration.');
    
    if (config.environment.isProduction) {
      console.error('Exiting due to missing configuration in production mode.');
      process.exit(1);
    } else {
      console.warn('Development mode: continuing with incomplete configuration.');
    }
  }
  
  return config;
};

// Export configuration with validation
module.exports = {
  getConfig,
  validateConfig,
  config: validateConfig() // Pre-validated configuration
};