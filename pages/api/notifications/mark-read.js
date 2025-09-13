import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { notificationIds, markAll = false } = req.body;

    if (!markAll && (!notificationIds || !Array.isArray(notificationIds))) {
      return res.status(400).json({ error: 'Invalid notification IDs provided' });
    }

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false); // Only update unread notifications

    if (!markAll) {
      query = query.in('id', notificationIds);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Error marking notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark notifications as read' });
    }

    return res.status(200).json({
      success: true,
      message: markAll 
        ? 'All notifications marked as read' 
        : `${data.length} notification(s) marked as read`,
      updatedCount: data.length
    });

  } catch (error) {
    console.error('Error in mark-read API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}