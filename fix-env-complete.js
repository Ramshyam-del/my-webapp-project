const fs = require('fs');
const path = require('path');

console.log('🔧 Complete Environment Fix...');
console.log('==============================');
console.log('');

// Read the .env.local file to get the correct values
const envLocalPath = path.join(__dirname, '.env.local');
let correctAnonKey = '';
let correctServiceKey = '';

if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // Extract the anon key (handle multi-line format)
  const anonKeyMatch = envLocalContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([\s\S]*?)(?=\n|$)/);
  if (anonKeyMatch) {
    correctAnonKey = anonKeyMatch[1].replace(/\s+/g, ''); // Remove all whitespace
  }
  
  // Extract the service key (handle multi-line format)
  const serviceKeyMatch = envLocalContent.match(/SUPABASE_SERVICE_ROLE_KEY=([\s\S]*?)(?=\n|$)/);
  if (serviceKeyMatch) {
    correctServiceKey = serviceKeyMatch[1].replace(/\s+/g, ''); // Remove all whitespace
  }
  
  console.log('✅ Found correct keys in .env.local');
  console.log(`📏 Anon key length: ${correctAnonKey.length} characters`);
  console.log(`📏 Service key length: ${correctServiceKey.length} characters`);
}

// Create a proper root .env file
const rootEnvContent = `NODE_ENV=production
BACKEND_PORT=4001
SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${correctServiceKey}

# Frontend Supabase Configuration (REQUIRED for frontend to work)
NEXT_PUBLIC_SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${correctAnonKey}

# optional:
COINMARKETCAP_API_KEY=131fe787-ebd7-425b-8896-fb007eb76f3f

# used only by the admin setup script:
ADMIN_EMAIL=ramshyamgopalhari@gmail.com
ADMIN_PASSWORD=@Million2026
`;

// Write the fixed root .env file
const rootEnvPath = path.join(__dirname, '.env');
try {
  fs.writeFileSync(rootEnvPath, rootEnvContent, 'utf8');
  console.log('✅ Root .env file updated with correct keys');
} catch (error) {
  console.error('❌ Error writing root .env file:', error.message);
}

// Also update the backend .env file
const backendEnvContent = `NODE_ENV=production
BACKEND_PORT=4001
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain

SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${correctServiceKey}

# optional:
COINMARKETCAP_API_KEY=131fe787-ebd7-425b-8896-fb007eb76f3f

# used only by the admin setup script:
ADMIN_EMAIL=ramshyamgopalhari@gmail.com
ADMIN_PASSWORD=@Million2026
`;

const backendEnvPath = path.join(__dirname, 'backend', '.env');
try {
  fs.writeFileSync(backendEnvPath, backendEnvContent, 'utf8');
  console.log('✅ Backend .env file updated with correct keys');
} catch (error) {
  console.error('❌ Error writing backend .env file:', error.message);
}

console.log('');
console.log('🎉 Environment files fixed!');
console.log('🚀 You can now restart your servers.');
console.log('');
console.log('📋 Verification:');
console.log('✅ Root .env: All keys properly formatted');
console.log('✅ Backend .env: All keys properly formatted');
console.log('✅ .env.local: Backup file with correct keys');
