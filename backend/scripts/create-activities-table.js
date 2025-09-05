const { serverSupabase } = require('../lib/supabaseServer');

async function createUserActivitiesTable() {
  try {
    console.log('Creating user_activities table...');
    
    // Create the table
    const { error: tableError } = await serverSupabase.rpc('exec', {
      sql: `
        -- Create user_activities table for tracking user actions
        CREATE TABLE IF NOT EXISTS user_activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          user_email TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          activity_description TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (tableError) {
      console.log('Table creation result:', tableError);
    } else {
      console.log('✅ Table created successfully');
    }
    
    // Create indexes
    console.log('Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_activities_user_email ON user_activities(user_email);',
      'CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);',
      'CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);'
    ];
    
    for (const indexSql of indexes) {
      const { error: indexError } = await serverSupabase.rpc('exec', { sql: indexSql });
      if (indexError) {
        console.log('Index creation result:', indexError);
      }
    }
    
    console.log('✅ Indexes created successfully');
    
    // Enable RLS
    console.log('Enabling Row Level Security...');
    const { error: rlsError } = await serverSupabase.rpc('exec', {
      sql: 'ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('RLS result:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    // Create policies
    console.log('Creating RLS policies...');
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Admin can view all user activities" ON user_activities
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
          )
        );`,
      `CREATE POLICY IF NOT EXISTS "Users can view their own activities" ON user_activities
        FOR SELECT USING (user_id = auth.uid());`,
      `CREATE POLICY IF NOT EXISTS "System can insert activities" ON user_activities
        FOR INSERT WITH CHECK (true);`
    ];
    
    for (const policySql of policies) {
      const { error: policyError } = await serverSupabase.rpc('exec', { sql: policySql });
      if (policyError) {
        console.log('Policy creation result:', policyError);
      }
    }
    
    console.log('✅ Policies created successfully');
    console.log('🎉 User activities table setup completed!');
    
  } catch (error) {
    console.error('❌ Error creating user activities table:', error);
    process.exit(1);
  }
}

// Test insert to verify table works
async function testTable() {
  try {
    console.log('Testing table with sample data...');
    
    const { data, error } = await serverSupabase
      .from('user_activities')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'test@example.com',
        activity_type: 'test',
        activity_description: 'Test activity for table verification',
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        metadata: { test: true }
      })
      .select();
    
    if (error) {
      console.log('Test insert error:', error);
    } else {
      console.log('✅ Test insert successful:', data);
      
      // Clean up test data
      await serverSupabase
        .from('user_activities')
        .delete()
        .eq('activity_type', 'test');
      
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

if (require.main === module) {
  createUserActivitiesTable()
    .then(() => testTable())
    .then(() => {
      console.log('✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createUserActivitiesTable, testTable };