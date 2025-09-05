/**
 * Environment Variable Validation Utility
 * Validates all required environment variables on application startup
 */

const requiredEnvVars = {
  // Supabase Configuration
  SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
    validate: (value) => value && value.startsWith('https://') && value.includes('.supabase.co')
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    description: 'Supabase service role key for server-side operations',
    validate: (value) => value && value.length > 100 && value.startsWith('eyJ')
  },
  SUPABASE_JWT_SECRET: {
    required: true,
    description: 'Supabase JWT secret for token verification',
    validate: (value) => value && value.length >= 32
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    description: 'Public Supabase URL for client-side operations',
    validate: (value) => value && value.startsWith('https://') && value.includes('.supabase.co')
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    description: 'Public Supabase anonymous key for client-side operations',
    validate: (value) => value && value.length > 100 && value.startsWith('eyJ')
  },
  
  // API Configuration
  ADMIN_API_KEY: {
    required: true,
    description: 'Admin API key for administrative operations',
    validate: (value) => value && value.length >= 32
  },
  
  // Email Configuration (for OTP)
  EMAIL_USER: {
    required: false,
    description: 'Email username for OTP sending',
    validate: (value) => !value || value.includes('@')
  },
  EMAIL_PASS: {
    required: false,
    description: 'Email password for OTP sending'
  },
  
  // Optional Configuration
  NEXT_PUBLIC_BACKEND_URL: {
    required: false,
    description: 'Backend API URL',
    default: 'http://localhost:4001',
    validate: (value) => !value || value.startsWith('http')
  },
  FRONTEND_URL: {
    required: false,
    description: 'Frontend URL for CORS',
    default: 'http://localhost:3000',
    validate: (value) => !value || value.startsWith('http')
  },
  NEXT_PUBLIC_SITE_URL: {
    required: false,
    description: 'Public site URL for redirects',
    default: 'http://localhost:3000',
    validate: (value) => !value || value.startsWith('http')
  },
  
  // Security Configuration
  BCRYPT_ROUNDS: {
    required: false,
    description: 'BCrypt hashing rounds',
    default: '12',
    validate: (value) => !value || (!isNaN(value) && parseInt(value) >= 10 && parseInt(value) <= 15)
  },
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    description: 'Rate limiting window in milliseconds',
    default: '900000', // 15 minutes
    validate: (value) => !value || (!isNaN(value) && parseInt(value) > 0)
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    description: 'Maximum requests per rate limit window',
    default: '100',
    validate: (value) => !value || (!isNaN(value) && parseInt(value) > 0)
  },
  CORS_ORIGIN: {
    required: false,
    description: 'CORS allowed origins (comma-separated)',
    default: 'http://localhost:3000'
  }
};

/**
 * Validates all environment variables
 * @param {boolean} exitOnError - Whether to exit process on validation failure
 * @returns {Object} Validation results
 */
function validateEnvironment(exitOnError = true) {
  const errors = [];
  const warnings = [];
  const validated = {};
  
  console.log('🔍 Validating environment variables...');
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    
    // Check if required variable is missing
    if (config.required && !value) {
      errors.push(`❌ Missing required environment variable: ${key} - ${config.description}`);
      continue;
    }
    
    // Use default value if not provided
    if (!value && config.default) {
      process.env[key] = config.default;
      validated[key] = config.default;
      warnings.push(`⚠️  Using default value for ${key}: ${config.default}`);
      continue;
    }
    
    // Validate value format if validator exists
    if (value && config.validate && !config.validate(value)) {
      errors.push(`❌ Invalid format for ${key}: ${config.description}`);
      continue;
    }
    
    if (value) {
      validated[key] = value;
      console.log(`✅ ${key}: Valid`);
    }
  }
  
  // Check for production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    const productionChecks = [
      {
        condition: process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.includes('localhost'),
        message: '⚠️  Production warning: NEXT_PUBLIC_BACKEND_URL contains localhost'
      },
      {
        condition: process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost'),
        message: '⚠️  Production warning: FRONTEND_URL contains localhost'
      },
      {
        condition: process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.includes('localhost'),
        message: '⚠️  Production warning: NEXT_PUBLIC_SITE_URL contains localhost'
      }
    ];
    
    productionChecks.forEach(check => {
      if (check.condition) {
        warnings.push(check.message);
      }
    });
  }
  
  // Display results
  if (warnings.length > 0) {
    console.log('\n📋 Warnings:');
    warnings.forEach(warning => console.log(warning));
  }
  
  if (errors.length > 0) {
    console.log('\n💥 Environment Validation Errors:');
    errors.forEach(error => console.log(error));
    
    console.log('\n📖 Environment Setup Guide:');
    console.log('1. Copy .env.example to .env in the backend directory');
    console.log('2. Fill in all required values');
    console.log('3. Ensure Supabase keys are from the same project');
    console.log('4. For production, use production URLs instead of localhost');
    
    if (exitOnError) {
      console.log('\n🚫 Application startup aborted due to environment validation errors.');
      process.exit(1);
    }
  } else {
    console.log('\n✅ All environment variables validated successfully!');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validated
  };
}

/**
 * Validates a specific environment variable
 * @param {string} key - Environment variable key
 * @returns {boolean} Whether the variable is valid
 */
function validateSingleVar(key) {
  const config = requiredEnvVars[key];
  if (!config) return false;
  
  const value = process.env[key];
  
  if (config.required && !value) return false;
  if (value && config.validate && !config.validate(value)) return false;
  
  return true;
}

/**
 * Gets all required environment variable keys
 * @returns {string[]} Array of required environment variable keys
 */
function getRequiredEnvVars() {
  return Object.entries(requiredEnvVars)
    .filter(([_, config]) => config.required)
    .map(([key, _]) => key);
}

module.exports = {
  validateEnvironment,
  validateSingleVar,
  getRequiredEnvVars,
  requiredEnvVars
};