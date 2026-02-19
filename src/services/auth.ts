import { supabase } from './supabaseClient';
import { Session, AuthError } from '@supabase/supabase-js';
import { recordFailedAttempt, resetAttempts, getRateLimitStatus, RateLimitStatus } from './authRateLimit';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  isLoading: boolean;
}

class AuthService {
  private currentSession: Session | null = null;
  private currentUser: UserProfile | null = null;

  async signIn(email: string, password: string): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await recordFailedAttempt();
      throw this.formatAuthError(error);
    }

    if (!data.session) {
      await recordFailedAttempt();
      throw new Error('No session returned after sign in');
    }

    if (!data.session.user.email_confirmed_at) {
      await supabase.auth.signOut();
      await recordFailedAttempt();
      throw new Error('Please confirm your email address before signing in. Check your inbox for a confirmation link.');
    }

    await resetAttempts();
    await this.setSession(data.session);

    if (!this.currentUser) {
      throw new Error('Failed to load user profile');
    }

    return this.currentUser;
  }

  async signUp(email: string, password: string, username?: string): Promise<{ requiresConfirmation: boolean; user: UserProfile }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw this.formatAuthError(error);
    }

    if (!data.user) {
      throw new Error('User creation failed');
    }

    const derivedUsername = username || email.split('@')[0];

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email,
        username: derivedUsername,
      });

    if (profileError && profileError.code !== '23505') {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    const userProfile: UserProfile = {
      id: data.user.id,
      email,
      username: derivedUsername,
    };

    if (data.session && data.session.user.email_confirmed_at) {
      await this.setSession(data.session);
      return { requiresConfirmation: false, user: this.currentUser || userProfile };
    }

    return { requiresConfirmation: true, user: userProfile };
  }

  async requestEmailOtp(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined, // We'll handle verification manually
      },
    });

    if (error) {
      throw this.formatAuthError(error);
    }
  }

  async verifyEmailOtp(email: string, token: string): Promise<{ session: Session; user: UserProfile }> {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      throw this.formatAuthError(error);
    }

    if (!data.session || !data.user) {
      throw new Error('OTP verification failed - no session returned');
    }

    const derivedUsername = email.split('@')[0];

    // Create profile if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email,
        username: derivedUsername,
      });

    // Ignore "already exists" errors
    if (profileError && profileError.code !== '23505') {
      console.warn('Failed to create profile:', profileError.message);
    }

    await this.setSession(data.session);

    const userProfile: UserProfile = {
      id: data.user.id,
      email,
      username: derivedUsername,
    };

    return { session: data.session, user: this.currentUser || userProfile };
  }

  async setPassword(password: string): Promise<UserProfile> {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw this.formatAuthError(error);
    }

    if (!data.user) {
      throw new Error('Password update failed');
    }

    // Update the current user in our state
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser };
    }

    return this.currentUser!;
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw this.formatAuthError(error);
    }
    this.currentSession = null;
    this.currentUser = null;
  }

  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      throw this.formatAuthError(error);
    }
  }

  async signInWithGoogle(redirectTo: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      throw this.formatAuthError(error);
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    if (this.currentSession) {
      return this.currentSession;
    }

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw this.formatAuthError(error);
    }

    if (session) {
      this.currentSession = session;
    }

    return session;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const session = await this.getCurrentSession();
    if (!session) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0],
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`);
        }

        this.currentUser = newProfile;
        return this.currentUser;
      }

      throw new Error(`Failed to load profile: ${error.message}`);
    }

    this.currentUser = profile;
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const session = await this.getCurrentSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    this.currentUser = data;
    return data;
  }

  getRateLimitStatus(): Promise<RateLimitStatus> {
    return getRateLimitStatus();
  }

  private async setSession(session: Session | null): Promise<void> {
    this.currentSession = session;
    if (session) {
      await this.getCurrentUser();
    } else {
      this.currentUser = null;
    }
  }

  private formatAuthError(error: AuthError): Error {
    const errorMessages: Record<string, string> = {
      invalid_credentials: 'Invalid email or password',
      user_not_found: 'User not found',
      email_not_confirmed: 'Please confirm your email address',
      email_taken: 'An account with this email already exists',
      weak_password: 'Password is too weak',
      rate_limit: 'Too many attempts. Please try again later',
      network_error: 'Network error. Please check your connection',
    };

    const errorCode = error.code || '';
    const message = errorMessages[errorCode] || error.message || 'An error occurred';
    return new Error(message);
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession = session;
      if (session) {
        this.getCurrentUser();
      } else {
        this.currentUser = null;
      }
      callback(session);
    });
  }
}

export const authService = new AuthService();
