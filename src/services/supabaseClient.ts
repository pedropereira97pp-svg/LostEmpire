import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Read environment variable with fallback aliases
 * Trims whitespace and validates the value
 */
function getEnvVar(
  primaryVar: string,
  fallbackVars: string[],
  description: string
): string {
  // Try primary variable
  let value = process.env[primaryVar];

  // Try fallback variables if primary is not set
  if (!value || value.trim() === '') {
    for (const fallbackVar of fallbackVars) {
      value = process.env[fallbackVar];
      if (value && value.trim() !== '') {
        break;
      }
    }
  }

  return value?.trim() || '';
}

/**
 * Get Supabase URL from environment variables with fallbacks
 */
function getSupabaseUrl(): string {
  const url = getEnvVar(
    'EXPO_PUBLIC_SUPABASE_URL',
    [
      'SUPABASE_URL',
      'REACT_APP_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
    ],
    'Supabase Project URL'
  );

  // Validate URL format
  if (url && !isValidUrl(url)) {
    throw new Error(
      `Invalid Supabase URL format: "${url}". Please check your .env file. ` +
      `Expected format: https://xyz.supabase.co`
    );
  }

  return url;
}

/**
 * Get Supabase Anon Key from environment variables with fallbacks
 */
function getSupabaseAnonKey(): string {
  return getEnvVar(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    [
      'SUPABASE_ANON_KEY',
      'REACT_APP_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_ANON_KEY',
    ],
    'Supabase Anon Key'
  );
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if Supabase configuration is valid
 */
export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return (
    url !== '' &&
    anonKey !== '' &&
    isValidUrl(url)
  );
};

/**
 * Lazy Supabase client initialization
 * Only creates the client when first accessed
 * Throws clear error if configuration is missing
 */
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  // Return cached instance if available
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  // Check if configuration is valid
  if (!url || url === '') {
    throw new Error(
      'Supabase URL is not configured. ' +
      'Please add EXPO_PUBLIC_SUPABASE_URL to your .env file. ' +
      'See .env.example for the required format. ' +
      'Get your URL from: https://supabase.com/dashboard/project/_/settings/api'
    );
  }

  if (!anonKey || anonKey === '') {
    throw new Error(
      'Supabase Anon Key is not configured. ' +
      'Please add EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file. ' +
      'See .env.example for the required format. ' +
      'Get your key from: https://supabase.com/dashboard/project/_/settings/api'
    );
  }

  if (!isValidUrl(url)) {
    throw new Error(
      `Invalid Supabase URL: "${url}". ` +
      'Please check your .env file. ' +
      'Expected format: https://xyz.supabase.co'
    );
  }

  // Create and cache the client
  supabaseClientInstance = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClientInstance;
}

/**
 * Export config for reference (read-only)
 * Use getSupabaseClient() for actual operations
 */
export const supabaseConfig = {
  get url(): string {
    return getSupabaseUrl();
  },
  get anonKey(): string {
    return getSupabaseAnonKey();
  },
  get isConfigured(): boolean {
    return isSupabaseConfigured();
  },
} as const;

/**
 * Legacy export for backward compatibility
 * @deprecated Use getSupabaseClient() instead
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof SupabaseClient];
  },
});
