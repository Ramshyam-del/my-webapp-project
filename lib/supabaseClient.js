import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Client Config:');
console.log('   URL:', url ? '✅ Set' : '❌ Missing');
console.log('   Anon Key:', anon ? '✅ Set' : '❌ Missing');

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC Supabase env');
}

export const supabase = createClient(url, anon);


