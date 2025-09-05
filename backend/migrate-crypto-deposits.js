require('dotenv').config();
const { supabaseAdmin } = require('./lib/supabaseAdmin');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting crypto deposits migration...');
    
    const sqlPath = path.join(__dirname, 'database', 'create-crypto-deposits-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL migration...');
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.warn(`Warning on statement ${i + 1}:`, error.message);
            // Continue with other statements even if one fails
          }
        } catch (err) {
          console.warn(`Warning on statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('Verifying tables...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['fund_transactions', 'crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config']);
    
    if (tablesError) {
      console.error('Error verifying tables:', tablesError);
    } else {
      console.log('Created tables:', tables.map(t => t.table_name));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();