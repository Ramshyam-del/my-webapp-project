#!/usr/bin/env node

/**
 * Script to update Supabase credentials after regeneration
 * Usage: node scripts/update-supabase-credentials.js <new_service_role_key> <new_anon_key>
 */

const fs = require('fs');
const path = require('path');

function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
      updated = true;
      console.log(`✅ Updated ${key} in ${filePath}`);
    } else {
      console.log(`⚠️  Key ${key} not found in ${filePath}`);
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('❌ Usage: node update-supabase-credentials.js <new_service_role_key> <new_anon_key>');
    console.error('Example: node update-supabase-credentials.js "eyJ..." "eyJ..."');
    process.exit(1);
  }

  const [newServiceRoleKey, newAnonKey] = args;

  console.log('🔄 Updating Supabase credentials...');

  // Update backend .env
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
  const backendUpdates = {
    'SUPABASE_SERVICE_ROLE_KEY': newServiceRoleKey,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': newAnonKey
  };
  
  updateEnvFile(backendEnvPath, backendUpdates);

  // Update frontend .env.local if it exists
  const frontendEnvPath = path.join(__dirname, '..', '.env.local');
  const frontendUpdates = {
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': newAnonKey
  };
  
  updateEnvFile(frontendEnvPath, frontendUpdates);

  console.log('\n✅ Credential update complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Restart the backend server: npm start (in backend directory)');
  console.log('2. Restart the frontend server: npm run dev');
  console.log('3. Test all functionality to ensure new keys work correctly');
  console.log('4. Delete this script and the SECURITY_CREDENTIAL_REGENERATION.md file');
}

if (require.main === module) {
  main();
}

module.exports = { updateEnvFile };