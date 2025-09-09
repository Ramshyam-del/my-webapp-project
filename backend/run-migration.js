const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function runMigration() {
  try {
    console.log('Running migration to add credit_score and vip_level columns...');
    
    const sql = fs.readFileSync('./database/add-credit-vip-columns.sql', 'utf8');
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement.trim() });
        if (error) {
          console.error('Error executing statement:', error);
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the columns were added
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'users')
      .in('column_name', ['credit_score', 'vip_level']);
      
    if (verifyError) {
      console.error('Error verifying columns:', verifyError);
    } else {
      console.log('✅ Verified columns:', columns);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();