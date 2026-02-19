import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
} as const;

export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseConfig.url !== '' &&
    supabaseConfig.url !== 'YOUR_SUPABASE_PROJECT_URL' &&
    supabaseConfig.anonKey !== '' &&
    supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
  );
};

export const supabase = createClient(supabaseConfig.url, supabaseAnonKey);
