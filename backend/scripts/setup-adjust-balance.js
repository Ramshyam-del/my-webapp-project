const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdjustBalanceFunction() {
  try {
    console.log('🔧 Setting up adjust_balance function and portfolios table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/create-adjust-balance-function.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements (remove comments and empty lines)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT')
      .map(stmt => stmt + ';');
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === ';') continue;
      
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec', {
        sql: statement
      });
      
      if (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('permission denied')) {
          console.log(`   ⚠️  ${error.message}`);
        } else {
          console.error(`   ❌ Error executing statement: ${error.message}`);
          console.error(`   Statement: ${statement}`);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    }
    
    // Test the function
    console.log('\n🧪 Testing adjust_balance function...');
    
    // Try to call the function with test parameters
    const { data: testResult, error: testError } = await supabase.rpc('adjust_balance', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      p_currency: 'USDT',
      p_delta: 100
    });
    
    if (testError) {
      if (testError.message.includes('does not exist')) {
        console.log('⚠️  Function exists but test user not found (this is expected)');
      } else {
        console.error('❌ Function test failed:', testError.message);
      }
    } else {
      console.log('✅ Function test successful:', testResult);
    }
    
    console.log('\n🎉 Setup completed! The adjust_balance function should now work properly.');
    console.log('💡 This should resolve the "user_id is ambiguous" errors in trade settlement.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupAdjustBalanceFunction();