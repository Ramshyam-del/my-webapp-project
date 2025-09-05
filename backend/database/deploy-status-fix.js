const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function deployStatusFix() {
    console.log('🔧 Starting status column fix...');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
        console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
        process.exit(1);
    }
    
    console.log('📡 Connecting to:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Read the SQL fix file
        const sqlPath = path.join(__dirname, 'fix-users-status-column.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Read SQL fix file');
        
        // Try to execute via exec_sql if available
        console.log('🔧 Attempting to add status column...');
        const { error: execError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'active\' CHECK (status IN (\'active\', \'inactive\', \'suspended\', \'pending_verification\', \'banned\', \'frozen\'));'
        });
        
        if (execError) {
            console.log('⚠️ exec_sql not available, trying alternative approach...');
            
            // Try to verify column exists by querying
            const { data: testData, error: testError } = await supabase
                .from('users')
                .select('id, email, role, status')
                .limit(1);
                
            if (testError && testError.code === '42703') {
                console.log('❌ Status column still missing. Manual intervention required.');
                console.log('\n📋 Manual steps needed:');
                console.log('1. Go to Supabase Dashboard > SQL Editor');
                console.log('2. Execute the following SQL:');
                console.log('\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'active\' CHECK (status IN (\'active\', \'inactive\', \'suspended\', \'pending_verification\', \'banned\', \'frozen\'));');
                console.log('UPDATE public.users SET status = \'active\' WHERE status IS NULL;');
                console.log('CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);');
                process.exit(1);
            } else {
                console.log('✅ Status column appears to exist');
            }
        } else {
            console.log('✅ Status column added successfully');
        }
        
        // Update any NULL status values
        console.log('🔄 Updating NULL status values...');
        const { error: updateError } = await supabase
            .from('users')
            .update({ status: 'active' })
            .is('status', null);
            
        if (updateError) {
            console.log('⚠️ Could not update NULL status values:', updateError.message);
        } else {
            console.log('✅ Updated NULL status values');
        }
        
        // Verify the fix
        console.log('🔍 Verifying status column...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('users')
            .select('id, email, role, status')
            .limit(3);
            
        if (verifyError) {
            console.log('❌ Verification failed:', verifyError.message);
            process.exit(1);
        } else {
            console.log('✅ Status column verification successful');
            console.log('📊 Sample data:', verifyData);
        }
        
        console.log('\n🎉 Status column fix completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Test your application to ensure the error is resolved');
        console.log('2. If you still see errors, check for other missing columns');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    deployStatusFix();
}

module.exports = { deployStatusFix };