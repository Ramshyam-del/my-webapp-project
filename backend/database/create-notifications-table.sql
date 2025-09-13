-- Create notifications table for user notifications
-- This table will store system notifications for users

BEGIN;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    -- Notification metadata
    is_read BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'general', -- e.g., 'withdrawal', 'trade', 'account', 'general'
    
    -- Related entity (optional)
    related_entity_type TEXT, -- e.g., 'withdrawal', 'trade', 'deposit'
    related_entity_id UUID, -- ID of the related entity
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ -- Optional expiration for temporary notifications
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Service role can manage all notifications
CREATE POLICY "Service role can manage all notifications" ON notifications
    FOR ALL USING (true);

-- Create function to automatically set read_at timestamp
CREATE OR REPLACE FUNCTION handle_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    -- Set read_at when is_read changes from false to true
    IF OLD.is_read = FALSE AND NEW.is_read = TRUE THEN
        NEW.read_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for read timestamp
CREATE TRIGGER notification_read_trigger
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_notification_read();

-- Grant permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Create helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_category TEXT DEFAULT 'general',
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        category,
        related_entity_type,
        related_entity_id
    )
    VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_category,
        p_related_entity_type,
        p_related_entity_id
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Success message
SELECT 'Notifications table created successfully!' as status;