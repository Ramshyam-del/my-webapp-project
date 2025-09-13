import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get query parameters for pagination and filtering
    const { 
      page = 1, 
      limit = 20, 
      category, 
      is_read, 
      type 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Apply same filters to count query
    if (category) {
      countQuery = countQuery.eq('category', category);
    }
    if (is_read !== undefined) {
      countQuery = countQuery.eq('is_read', is_read === 'true');
    }
    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting notifications:', countError);
      return res.status(500).json({ error: 'Failed to count notifications' });
    }

    // Get unread count
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (unreadError) {
      console.error('Error counting unread notifications:', unreadError);
      return res.status(500).json({ error: 'Failed to count unread notifications' });
    }

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}