import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitState {
  attempts: number;
  lockedUntil: number | null;
}

async function getState(): Promise<RateLimitState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw) as RateLimitState;
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

async function setState(state: RateLimitState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function recordFailedAttempt(): Promise<void> {
  const state = await getState();
  const attempts = state.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : state.lockedUntil;
  await setState({ attempts, lockedUntil });
}

export async function resetAttempts(): Promise<void> {
  await setState({ attempts: 0, lockedUntil: null });
}

export interface RateLimitStatus {
  canAttempt: boolean;
  secondsRemaining: number;
  attemptsRemaining: number;
}

export async function getRateLimitStatus(): Promise<RateLimitStatus> {
  const state = await getState();

  if (state.lockedUntil !== null) {
    const remaining = state.lockedUntil - Date.now();
    if (remaining > 0) {
      return {
        canAttempt: false,
        secondsRemaining: Math.ceil(remaining / 1000),
        attemptsRemaining: 0,
      };
    }
    // Lockout expired — reset
    await setState({ attempts: 0, lockedUntil: null });
    return { canAttempt: true, secondsRemaining: 0, attemptsRemaining: MAX_ATTEMPTS };
  }

  return {
    canAttempt: true,
    secondsRemaining: 0,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - state.attempts),
  };
}
