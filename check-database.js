// Script to check and create database tables
// Run this in browser console

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('❌ No session found - please login first');
      return;
    }
    
    console.log('✅ User logged in:', session.user.email);
    
    // Check if trading_orders table exists by trying to query it
    const { data: orders, error: ordersError } = await supabase
      .from('trading_orders')
      .select('count')
      .limit(1);
    
    if (ordersError) {
      console.log('❌ trading_orders table error:', ordersError);
      console.log('💡 You need to run the database setup SQL in Supabase');
      console.log('📋 Go to your Supabase dashboard > SQL Editor');
      console.log('📋 Copy and paste the complete-database-setup.sql file');
    } else {
      console.log('✅ trading_orders table exists');
    }
    
    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users table error:', usersError);
    } else {
      console.log('✅ users table exists');
    }
    
    // Try to insert a test user record
    const { data: testUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        id: session.user.id,
        email: session.user.email,
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        console.log('✅ User already exists in database');
      } else {
        console.log('❌ Error inserting user:', insertError);
      }
    } else {
      console.log('✅ User created in database:', testUser);
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error);
  }
}

// Run the check
checkDatabase(); 