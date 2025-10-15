const { serverSupabase } = require('./backend/lib/supabaseServer');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const { data, error } = await serverSupabase
      .from('trades')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Query failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('✅ Sample query result:', data);
  } catch (error) {
    console.log('❌ Database connection test failed:', error);
  }
}

testDatabaseConnection();