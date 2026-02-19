import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLACEHOLDER_URL = 'YOUR_SUPABASE_PROJECT_URL';
const PLACEHOLDER_KEY = 'YOUR_SUPABASE_ANON_KEY';

const rawUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  '';

const rawAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

const supabaseUrl = rawUrl.trim();
const supabaseAnonKey = rawAnonKey.trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl !== '' &&
    supabaseUrl !== PLACEHOLDER_URL &&
    supabaseAnonKey !== '' &&
    supabaseAnonKey !== PLACEHOLDER_KEY
  );
};

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
} as const;

let _client: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (_client) {
    return _client;
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Please create a .env file with ' +
        'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
        'See .env.example for reference.'
    );
  }

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _client;
};
