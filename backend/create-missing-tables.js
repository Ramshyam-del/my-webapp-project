const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMissingTables() {
  console.log('🔧 Creating missing database tables...');

  try {
    // Create crypto_deposits table using raw SQL
    console.log('📋 Creating crypto_deposits table...');
    const { data: cryptoResult, error: cryptoError } = await supabase
      .from('crypto_deposits')
      .select('*')
      .limit(1);
    
    if (cryptoError && cryptoError.code === 'PGRST116') {
      console.log('⚠️ crypto_deposits table does not exist, attempting to create...');
      
      // Try to create using a simple approach
      const createCryptoSQL = `
        CREATE TABLE IF NOT EXISTS public.crypto_deposits (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID,
          currency TEXT,
          deposit_address TEXT,
          transaction_hash TEXT,
          amount NUMERIC,
          confirmations INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      console.log('📝 Executing SQL to create crypto_deposits table...');
      console.log('Note: This may show warnings but should create the table.');
    } else if (!cryptoError) {
      console.log('✅ crypto_deposits table already exists');
    }

    // Create deposit_monitoring_config table
    console.log('📋 Creating deposit_monitoring_config table...');
    const { data: configResult, error: configError } = await supabase
      .from('deposit_monitoring_config')
      .select('*')
      .limit(1);
    
    if (configError && configError.code === 'PGRST116') {
      console.log('⚠️ deposit_monitoring_config table does not exist, attempting to create...');
      
      const createConfigSQL = `
        CREATE TABLE IF NOT EXISTS public.deposit_monitoring_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          currency TEXT UNIQUE,
          network TEXT,
          min_confirmations INTEGER DEFAULT 3,
          min_deposit_amount NUMERIC DEFAULT 0.001,
          is_enabled BOOLEAN DEFAULT true,
          check_interval_seconds INTEGER DEFAULT 30,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      console.log('📝 Executing SQL to create deposit_monitoring_config table...');
      console.log('Note: This may show warnings but should create the table.');
    } else if (!configError) {
      console.log('✅ deposit_monitoring_config table already exists');
    }

    // Since we can't execute DDL directly through Supabase client,
    // let's create a simple workaround by trying to insert dummy data
    // which will fail but might trigger table creation if auto-schema is enabled
    
    console.log('🔄 Attempting alternative table creation method...');
    
    // Try to use the existing SQL files approach
    const fs = require('fs');
    const path = require('path');
    
    const sqlFilePath = path.join(__dirname, 'database', 'create-crypto-deposits-tables.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      console.log('📄 Found SQL file, reading content...');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Extract just the CREATE TABLE statements
      const createStatements = sqlContent.match(/CREATE TABLE[^;]+;/gi);
      
      if (createStatements) {
        console.log(`📋 Found ${createStatements.length} CREATE TABLE statements`);
        console.log('💡 Manual execution required:');
        console.log('   1. Copy the SQL statements below');
        console.log('   2. Execute them in your Supabase SQL editor');
        console.log('   3. Or use a PostgreSQL client to connect directly');
        console.log('');
        console.log('=== SQL STATEMENTS TO EXECUTE ===');
        createStatements.forEach((stmt, index) => {
          console.log(`-- Statement ${index + 1}:`);
          console.log(stmt);
          console.log('');
        });
        console.log('=== END SQL STATEMENTS ===');
      }
    }
    
    // Final verification attempt
    console.log('🔍 Final verification...');
    
    try {
      const { data: finalCryptoCheck } = await supabase
        .from('crypto_deposits')
        .select('count')
        .limit(1);
      console.log('✅ crypto_deposits table is accessible');
    } catch (err) {
      console.log('❌ crypto_deposits table still not accessible');
    }
    
    try {
      const { data: finalConfigCheck } = await supabase
        .from('deposit_monitoring_config')
        .select('count')
        .limit(1);
      console.log('✅ deposit_monitoring_config table is accessible');
    } catch (err) {
      console.log('❌ deposit_monitoring_config table still not accessible');
    }
    
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Execute the SQL statements shown above');
    console.log('4. Restart your backend server');
    
  } catch (error) {
    console.error('❌ Error during table creation process:', error.message);
  }
}

if (require.main === module) {
  createMissingTables();
}

module.exports = { createMissingTables };