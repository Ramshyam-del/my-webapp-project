import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    // Update the specific notification to mark as read
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_read', false) // Only update if currently unread
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Notification not found or already read' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: data
    });

  } catch (error) {
    console.error('Error in notification read API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}