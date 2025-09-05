/**
 * Client-side Environment Variable Validation
 * Validates required environment variables for Next.js frontend
 */

const requiredClientEnvVars = {
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
  NEXT_PUBLIC_BACKEND_URL: {
    required: false,
    description: 'Backend API URL',
    default: 'http://localhost:4001',
    validate: (value) => !value || value.startsWith('http')
  },
  NEXT_PUBLIC_SITE_URL: {
    required: false,
    description: 'Public site URL for redirects',
    default: 'http://localhost:3000',
    validate: (value) => !value || value.startsWith('http')
  }
};

/**
 * Validates client-side environment variables
 * @param {boolean} throwOnError - Whether to throw error on validation failure
 * @returns {Object} Validation results
 */
function validateClientEnvironment(throwOnError = false) {
  const errors = [];
  const warnings = [];
  
  // Only run validation in browser environment
  if (typeof window === 'undefined') {
    return { isValid: true, errors: [], warnings: [] };
  }
  
  console.log('🔍 Validating client environment variables...');
  
  for (const [key, config] of Object.entries(requiredClientEnvVars)) {
    const value = process.env[key];
    
    // Check if required variable is missing
    if (config.required && !value) {
      const error = `Missing required environment variable: ${key} - ${config.description}`;
      errors.push(error);
      console.error(`❌ ${error}`);
      continue;
    }
    
    // Validate value format if validator exists
    if (value && config.validate && !config.validate(value)) {
      const error = `Invalid format for ${key}: ${config.description}`;
      errors.push(error);
      console.error(`❌ ${error}`);
      continue;
    }
    
    if (value) {
      console.log(`✅ ${key}: Valid`);
      
      // Check for localhost URLs in production
      if (process.env.NODE_ENV === 'production' && value.includes('localhost')) {
        const warning = `Production warning: ${key} contains localhost`;
        warnings.push(warning);
        console.warn(`⚠️  ${warning}`);
      }
    } else if (config.default) {
      console.log(`⚠️  Using default value for ${key}: ${config.default}`);
    }
  }
  
  const isValid = errors.length === 0;
  
  if (!isValid) {
    console.error('\n💥 Client Environment Validation Failed!');
    console.error('Please check your .env.local file and ensure all required variables are set.');
    
    if (throwOnError) {
      throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }
  } else {
    console.log('\n✅ Client environment variables validated successfully!');
  }
  
  return {
    isValid,
    errors,
    warnings
  };
}

/**
 * Hook for React components to validate environment on mount
 */
function useEnvironmentValidation() {
  if (typeof window !== 'undefined') {
    // Run validation once when component mounts
    React.useEffect(() => {
      validateClientEnvironment(false);
    }, []);
  }
}

// Auto-validate in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  validateClientEnvironment(false);
}

module.exports = {
  validateClientEnvironment,
  useEnvironmentValidation,
  requiredClientEnvVars
};

// Also export as ES module for Next.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = validateClientEnvironment;
}