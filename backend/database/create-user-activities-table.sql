-- Create user_activities table for tracking user actions
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login', 'logout', 'registration', 'trade_created', 'trade_completed', 
    'withdrawal_requested', 'withdrawal_completed', 'deposit', 'profile_updated',
    'password_changed', 'account_frozen', 'account_unfrozen'
  )),
  activity_description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_email ON user_activities(user_email);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all user activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON user_activities;

-- Create RLS policies
-- Allow admins to view all activities
CREATE POLICY "Admins can view all user activities" ON user_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Allow users to view their own activities
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

-- Allow system to insert activities (service role)
CREATE POLICY "System can insert activities" ON user_activities
  FOR INSERT WITH CHECK (true);

COMMIT;