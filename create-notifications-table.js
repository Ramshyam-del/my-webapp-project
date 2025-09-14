const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createNotificationsTable() {
  console.log('🔧 Creating notifications table...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./backend/database/create-notifications-table.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      console.log('\n📋 Manual Setup Required:');
      console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
      console.log('\n' + '='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80));
      console.log('\n🌐 Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql');
    } else {
      console.log('✅ Notifications table created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    
    // Fallback: show the SQL content
    try {
      const sql = fs.readFileSync('./backend/database/create-notifications-table.sql', 'utf8');
      console.log('\n📋 Manual Setup Required:');
      console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
      console.log('\n' + '='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80));
      console.log('\n🌐 Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql');
    } catch (fileError) {
      console.error('❌ Could not read SQL file:', fileError.message);
    }
  }
}

createNotificationsTable();