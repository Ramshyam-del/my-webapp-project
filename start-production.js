#!/usr/bin/env node

/**
 * Production Start Script for Quantex Trading Platform
 * This script starts the application in production mode with proper environment configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set production environment
process.env.NODE_ENV = 'production';

// Load production environment variables
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('✅ Loaded production environment variables');
} else {
  console.warn('⚠️  Production environment file not found, using default variables');
}

// Verify critical environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'COINMARKETCAP_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('📝 The market page will fall back to mock data if CoinMarketCap API key is missing');
}

console.log('🚀 Starting Quantex Trading Platform in production mode...');
console.log('📊 Market API:', process.env.COINMARKETCAP_API_KEY ? 'Live CoinMarketCap data' : 'Mock data fallback');
console.log('🌐 Environment: Production');
console.log('🔗 URL: http://localhost:3000');

// Start the Next.js production server
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`\n🛑 Production server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down production server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down production server...');
  server.kill('SIGTERM');
});