#!/usr/bin/env node

/**
 * Setup Security Monitoring
 * Creates the security_events table and related database objects
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSecurityMonitoring() {
  console.log('🔧 Setting up security monitoring...');

  try {
    // Create security_events table
    console.log('📋 Creating security_events table...');
    
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Security Events Table
        CREATE TABLE IF NOT EXISTS security_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            ip_address INET,
            details JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.log('⚠️  Table creation via RPC failed, trying direct insert...');
      
      // Try alternative approach - check if table exists by querying it
      const { error: checkError } = await supabase
        .from('security_events')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === 'PGRST106') {
        console.log('❌ security_events table does not exist');
        console.log('\n📋 Please run the following SQL in your Supabase SQL editor:');
        console.log('\n' + '='.repeat(80));
        console.log(`
-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address INET,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity ON security_events(event_type, severity);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access security events
DROP POLICY IF EXISTS "Service role can manage security events" ON security_events;
CREATE POLICY "Service role can manage security events" ON security_events
    FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE security_events IS 'Stores security events for monitoring and intrusion detection';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event (e.g., FAILED_AUTHENTICATION, SUSPICIOUS_REQUEST)';
COMMENT ON COLUMN security_events.severity IS 'Event severity level: low, medium, high, critical';
COMMENT ON COLUMN security_events.ip_address IS 'Source IP address of the security event';
COMMENT ON COLUMN security_events.details IS 'Additional event details stored as JSON';
`);
        console.log('\n' + '='.repeat(80));
        console.log('\n⚠️  After running the SQL, restart this script to continue setup.');
        return false;
      } else {
        console.log('✅ security_events table already exists');
      }
    } else {
      console.log('✅ security_events table created successfully');
    }

    // Test the table by inserting a setup event
    console.log('🧪 Testing security events table...');
    
    const { error: insertError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'SECURITY_MONITORING_SETUP',
        severity: 'low',
        details: {
          setupBy: 'script',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    if (insertError) {
      console.error('❌ Failed to insert test event:', insertError);
      return false;
    }

    console.log('✅ Security events table is working correctly');

    // Test security monitoring service
    console.log('🔍 Testing security monitoring service...');
    
    try {
      const securityMonitor = require('../backend/services/securityMonitor');
      
      await securityMonitor.logSecurityEvent('SETUP_TEST', {
        testEvent: true,
        setupScript: true
      }, 'low', '127.0.0.1');
      
      console.log('✅ Security monitoring service is working');
    } catch (serviceError) {
      console.warn('⚠️  Security monitoring service test failed:', serviceError.message);
      console.log('   This is expected if the backend server is not running');
    }

    console.log('\n🎉 Security monitoring setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart the backend server to load security services');
    console.log('2. Check security events: GET /api/admin/security/events');
    console.log('3. View security report: GET /api/admin/security/report');
    console.log('4. Monitor logs for security alerts');
    
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

if (require.main === module) {
  setupSecurityMonitoring()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { setupSecurityMonitoring };