require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function createWithdrawalsTable() {
  try {
    console.log('Loading environment variables...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('Creating withdrawals table manually...');
    
    // Try to create the table using direct SQL queries
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('withdrawals')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Withdrawals table already exists!');
      return;
    }
    
    console.log('Table does not exist, attempting to create it...');
    
    // Since we can't execute raw SQL, let's try to create a simple record to trigger table creation
    // This won't work, but let's see what error we get
    const { data, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        currency: 'USDT',
        amount: 0,
        withdrawal_address: 'test',
        network: 'ethereum',
        status: 'pending'
      });
    
    if (error) {
      console.log('Expected error (table doesn\'t exist):', error.message);
      console.log('\n⚠️  Manual action required:');
      console.log('Please execute the SQL in create-withdrawals-table.sql manually in your Supabase SQL editor.');
      console.log('You can find the SQL editor at: https://supabase.com/dashboard/project/[your-project]/sql');
    } else {
      console.log('✅ Table created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Manual action required:');
    console.log('Please execute the SQL in create-withdrawals-table.sql manually in your Supabase SQL editor.');
    console.log('You can find the SQL editor at: https://supabase.com/dashboard/project/[your-project]/sql');
  }
}

createWithdrawalsTable();