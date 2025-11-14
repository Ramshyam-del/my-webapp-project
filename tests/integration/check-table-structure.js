const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking withdrawals table structure...');
  
  try {
    // Get table information using SQL query
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'withdrawals' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.error('❌ Error checking table structure:', error.message);
      
      // Fallback: try to select from the table to see what happens
      console.log('\n🔄 Trying fallback method...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('withdrawals')
        .select('*')
        .limit(0);
      
      if (fallbackError) {
        console.error('❌ Fallback failed:', fallbackError.message);
        
        if (fallbackError.message.includes('does not exist')) {
          console.log('\n💡 The withdrawals table does not exist yet.');
          console.log('Please run the SQL script in Supabase to create it.');
        }
      } else {
        console.log('✅ Table exists but column info unavailable');
      }
      return;
    }
    
    if (data && data.length > 0) {
      console.log('\n📋 Current table structure:');
      data.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('❌ No column information found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkTableStructure();