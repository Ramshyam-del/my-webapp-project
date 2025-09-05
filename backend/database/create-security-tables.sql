-- Security Events Table
-- Stores security-related events for monitoring and alerting

CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address INET,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_security_events_created_at ON security_events(created_at),
    INDEX idx_security_events_severity ON security_events(severity),
    INDEX idx_security_events_type ON security_events(event_type),
    INDEX idx_security_events_ip ON security_events(ip_address),
    INDEX idx_security_events_type_severity ON security_events(event_type, severity)
);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access security events
CREATE POLICY "Service role can manage security events" ON security_events
    FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE security_events IS 'Stores security events for monitoring and intrusion detection';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event (e.g., FAILED_AUTHENTICATION, SUSPICIOUS_REQUEST)';
COMMENT ON COLUMN security_events.severity IS 'Event severity level: low, medium, high, critical';
COMMENT ON COLUMN security_events.ip_address IS 'Source IP address of the security event';
COMMENT ON COLUMN security_events.details IS 'Additional event details stored as JSON';

-- Security Event Types Reference (for documentation)
/*
Common event_type values:
- FAILED_AUTHENTICATION: Failed login attempts
- SUSPICIOUS_REQUEST: Potentially malicious requests
- ADMIN_API_ACCESS: Admin API key usage
- BRUTE_FORCE_DETECTED: Brute force attack detected
- SUSPICIOUS_ACTIVITY_DETECTED: High volume of suspicious requests
- ADMIN_ACCOUNT_ATTACK: Multiple failed admin login attempts
- SQL_INJECTION_ATTEMPT: Potential SQL injection detected
- KEY_ROTATION: API key rotation events
- UNAUTHORIZED_ACCESS: Access attempts without proper authorization
- RATE_LIMIT_EXCEEDED: Rate limiting triggered
*/

-- Create a view for recent critical events
CREATE OR REPLACE VIEW recent_critical_security_events AS
SELECT 
    id,
    event_type,
    severity,
    ip_address,
    details,
    created_at
FROM security_events
WHERE severity IN ('critical', 'high')
    AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create a function to clean up old security events (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO operation_logs (operation_type, details, created_by)
    VALUES (
        'SECURITY_CLEANUP',
        jsonb_build_object(
            'deleted_events', deleted_count,
            'cleanup_date', NOW()
        ),
        'system'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run weekly (requires pg_cron extension)
-- SELECT cron.schedule('security-cleanup', '0 2 * * 0', 'SELECT cleanup_old_security_events();');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON security_events TO service_role;
GRANT SELECT ON recent_critical_security_events TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_security_events() TO service_role;