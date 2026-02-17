// Supabase Configuration Placeholder
// TODO: Replace these placeholder values with your actual Supabase project credentials
// Get your credentials from: https://supabase.com/dashboard

export const supabaseConfig = {
  url: 'YOUR_SUPABASE_PROJECT_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
} as const;

export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseConfig.url !== 'YOUR_SUPABASE_PROJECT_URL' &&
    supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
  );
};

// This is a placeholder client. In production, you would initialize the real Supabase client here:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export const supabase = null;
