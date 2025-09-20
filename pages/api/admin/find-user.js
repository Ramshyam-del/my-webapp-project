import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Finding user by email:', email);

    // Search in auth.users first
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!authError && authUsers?.users) {
      const authUser = authUsers.users.find(u => 
        u.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (authUser) {
        console.log('User found in auth.users:', authUser.email);
        return res.status(200).json({
          ok: true,
          user: {
            id: authUser.id,
            email: authUser.email,
            username: authUser.user_metadata?.username || authUser.email.split('@')[0],
            source: 'auth.users'
          }
        });
      }
    }

    // Search in public.users as fallback
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('id, email, username')
      .ilike('email', email)
      .limit(1);

    if (!publicError && publicUsers && publicUsers.length > 0) {
      const publicUser = publicUsers[0];
      console.log('User found in public.users:', publicUser.email);
      return res.status(200).json({
        ok: true,
        user: {
          id: publicUser.id,
          email: publicUser.email,
          username: publicUser.username,
          source: 'public.users'
        }
      });
    }

    console.log('User not found in any table');
    return res.status(404).json({
      ok: false,
      error: 'User not found',
      searched: ['auth.users', 'public.users']
    });

  } catch (error) {
    console.error('Find user API error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}