const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateUserTrigger() {
  try {
    console.log('Updating user trigger function...');
    
    // Update the handle_new_user function to save additional user metadata
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.users (
                id, 
                email, 
                username, 
                first_name, 
                last_name, 
                phone, 
                role, 
                status, 
                created_at, 
                updated_at
            )
            VALUES (
                NEW.id, 
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'username', ''),
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'phone', ''),
                'user', 
                'active', 
                NOW(), 
                NOW()
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Recreate the trigger
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });

    if (error) {
      console.error('Error updating trigger:', error);
      return;
    }

    console.log('✅ User trigger updated successfully!');
    console.log('Now new user registrations will save username, first_name, last_name, and phone.');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

updateUserTrigger();