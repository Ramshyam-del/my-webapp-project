const { serverSupabase } = require('./backend/lib/supabaseServer');

async function checkTradesConstraints() {
  console.log('Checking trades table constraints...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // Check constraints on trades table
    console.log('🔍 Checking constraints...');
    const { data: constraints, error } = await serverSupabase
      .rpc('get_constraints', { table_name: 'trades' });
    
    if (error) {
      console.log('❌ Failed to get constraints:', error);
      // Try a different approach
      const { data: columns, error: columnsError } = await serverSupabase
        .from('information_schema.columns')
        .select('column_name, is_nullable, column_default, data_type')
        .eq('table_name', 'trades')
        .eq('table_schema', 'public')
        .order('ordinal_position');
      
      if (columnsError) {
        console.log('❌ Failed to get columns:', columnsError);
        return;
      }
      
      console.log('✅ Columns:', columns);
      return;
    }
    
    console.log('✅ Constraints:', constraints);
  } catch (error) {
    console.log('❌ Constraint check failed:', error);
  }
}

checkTradesConstraints();