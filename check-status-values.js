const { serverSupabase } = require('./backend/lib/supabaseServer');

async function checkStatusValues() {
  console.log('Checking status values in trades table...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Get distinct status values from the trades table
    console.log('🔍 Getting distinct status values...');
    const { data: statuses, error } = await serverSupabase
      .from('trades')
      .select('status')
      .neq('status', null)
      .limit(100);
    
    if (error) {
      console.log('❌ Failed to get status values:', error);
      return;
    }
    
    // Get unique status values
    const uniqueStatuses = [...new Set(statuses.map(item => item.status))];
    console.log('✅ Distinct status values:', uniqueStatuses);
    
    // Try to update with each status to see which ones work
    for (const status of uniqueStatuses) {
      console.log(`🔍 Testing status value: ${status}`);
    }
  } catch (error) {
    console.log('❌ Status values check failed:', error);
  }
}

checkStatusValues();