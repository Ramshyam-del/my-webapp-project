-- Security Events Table Setup
-- Run this SQL in your Supabase SQL Editor

-- Create security_events table
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

-- Insert a test record to verify the table works
INSERT INTO security_events (event_type, severity, details) 
VALUES ('SECURITY_MONITORING_SETUP', 'low', '{"setupBy": "manual", "version": "1.0.0"}');

-- Verify the table was created successfully
SELECT COUNT(*) as total_events FROM security_events;