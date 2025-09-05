const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function deployCurrencyPairFix() {
  try {
    console.log('🔧 Starting currency_pair column fix deployment...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please check your .env file.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, 'add-currency-pair-column.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Loaded SQL fix from:', sqlPath);
    
    // Execute the SQL commands one by one
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.toLowerCase().includes('select')) {
        // For verification query, use rpc if available
        console.log('🔍 Executing verification query...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.log('⚠️  Verification query failed (this is expected if exec_sql is not available):', error.message);
        } else {
          console.log('✅ Verification result:', data);
        }
      } else {
        // For DDL commands, try direct execution
        console.log('🔨 Executing:', command.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.log('⚠️  Command failed (trying alternative approach):', error.message);
          // Alternative: try using PostgREST directly for some operations
          if (command.toLowerCase().includes('update')) {
            console.log('🔄 Attempting UPDATE via PostgREST...');
            const { error: updateError } = await supabase
              .from('trades')
              .update({ currency_pair: supabase.raw('pair') })
              .is('currency_pair', null);
            if (updateError) {
              console.log('❌ UPDATE failed:', updateError.message);
            } else {
              console.log('✅ UPDATE successful via PostgREST');
            }
          }
        } else {
          console.log('✅ Command executed successfully');
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification - checking trades table structure...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, pair, currency_pair')
      .limit(1);
    
    if (tradesError) {
      console.log('❌ Verification failed:', tradesError.message);
    } else {
      console.log('✅ Trades table accessible with columns:', Object.keys(trades[0] || {}));
      if (trades[0] && trades[0].currency_pair !== undefined) {
        console.log('🎉 SUCCESS: currency_pair column is now available!');
      } else {
        console.log('⚠️  currency_pair column may still be missing');
      }
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n📋 MANUAL INSTRUCTIONS:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Execute these commands manually:');
    console.log('\nALTER TABLE trades ADD COLUMN IF NOT EXISTS currency_pair TEXT;');
    console.log('UPDATE trades SET currency_pair = pair WHERE currency_pair IS NULL;');
    console.log('ALTER TABLE trades ALTER COLUMN currency_pair SET NOT NULL;');
    console.log('CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON trades(currency_pair);');
    process.exit(1);
  }
}

deployCurrencyPairFix();