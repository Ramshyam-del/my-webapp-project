-- =====================================================
-- USER SESSIONS TABLE FOR CROSS-BROWSER SYNCHRONIZATION
-- =====================================================

-- Create user_sessions table for cross-browser session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    browser_fingerprint TEXT,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sessions" ON user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR (last_activity < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO user_activities (user_id, activity_type, description, metadata)
    SELECT 
        '00000000-0000-0000-0000-000000000000'::uuid,
        'session_cleanup',
        'Automated session cleanup',
        jsonb_build_object('deleted_sessions', deleted_count, 'cleanup_time', NOW())
    WHERE deleted_count > 0;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active sessions for a user
CREATE OR REPLACE FUNCTION get_user_active_sessions(target_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    session_token TEXT,
    device_info JSONB,
    ip_address INET,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.session_token,
        us.device_info,
        us.ip_address,
        us.last_activity,
        us.created_at
    FROM user_sessions us
    WHERE us.user_id = target_user_id 
        AND us.is_active = true 
        AND us.expires_at > NOW()
    ORDER BY us.last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invalidate all sessions except current
CREATE OR REPLACE FUNCTION invalidate_other_sessions(target_user_id UUID, current_session_token TEXT)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = target_user_id 
        AND session_token != current_session_token 
        AND is_active = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log session invalidation
    INSERT INTO user_activities (user_id, activity_type, description, metadata)
    VALUES (
        target_user_id,
        'session_invalidation',
        'Other sessions invalidated',
        jsonb_build_object('invalidated_sessions', updated_count, 'kept_session', current_session_token)
    );
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_sessions IS 'Stores user sessions for cross-browser synchronization and session management';
COMMENT ON COLUMN user_sessions.session_token IS 'Unique session identifier for authentication';
COMMENT ON COLUMN user_sessions.browser_fingerprint IS 'Browser fingerprint for device identification';
COMMENT ON COLUMN user_sessions.device_info IS 'Device and browser information stored as JSON';
COMMENT ON COLUMN user_sessions.session_data IS 'Additional session data for cross-browser state sync';
COMMENT ON COLUMN user_sessions.last_activity IS 'Timestamp of last session activity for timeout management';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_active_sessions(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION invalidate_other_sessions(UUID, TEXT) TO service_role;

-- Success message
SELECT 'User sessions table created successfully for cross-browser synchronization!' as status;