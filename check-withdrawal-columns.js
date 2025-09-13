const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  try {
    console.log('Checking withdrawal table structure...');
    
    // Try to get one withdrawal record to see the columns
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Withdrawal table columns:', Object.keys(data[0]));
      console.log('Sample record:', data[0]);
    } else {
      console.log('No withdrawal records found');
      
      // Try to get table info from information_schema
      const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: 'withdrawals' })
        .select();
        
      if (colError) {
        console.log('Could not get column info:', colError.message);
      } else {
        console.log('Table columns from schema:', columns);
      }
    }
  } catch (err) {
    console.error('Script error:', err.message);
  }
}

checkColumns();