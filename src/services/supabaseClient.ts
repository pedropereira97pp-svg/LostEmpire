import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Expo projects, environment variables can be accessed via:
// 1. process.env.EXPO_PUBLIC_* (in managed workflow)
// 2. app.json extra config (for production builds)
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

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

export const supabase = createClient(supabaseConfig.url, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
