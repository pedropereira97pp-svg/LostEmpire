export { authService } from './auth';
export { getSupabaseClient } from './supabaseClient';
export { getRateLimitStatus, recordFailedAttempt, resetAttempts } from './authRateLimit';
export type { UserProfile, AuthState, RateLimitStatus } from './auth';
export type { RateLimitStatus as AuthRateLimitStatus } from './authRateLimit';
