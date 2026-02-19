import { supabase } from './supabaseClient';
import { Session, AuthError } from '@supabase/supabase-js';

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
      throw this.formatAuthError(error);
    }

    if (!data.session) {
      throw new Error('No session returned after sign in');
    }

    await this.setSession(data.session);

    if (!this.currentUser) {
      throw new Error('Failed to load user profile');
    }

    return this.currentUser;
  }

  async signUp(email: string, password: string, username?: string): Promise<UserProfile> {
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

    // Create profile row for the new user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email,
        username: username || email.split('@')[0],
      });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // but for now we'll just throw the error
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    if (data.session) {
      await this.setSession(data.session);
      return this.currentUser!;
    }

    // Email confirmation may be required
    return {
      id: data.user.id,
      email: email,
      username: username || email.split('@')[0],
    };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw this.formatAuthError(error);
    }
    this.currentSession = null;
    this.currentUser = null;
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
      // If profile doesn't exist, create one
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

  private async setSession(session: Session | null): Promise<void> {
    this.currentSession = session;
    if (session) {
      await this.getCurrentUser();
    } else {
      this.currentUser = null;
    }
  }

  private formatAuthError(error: AuthError): Error {
    // Map Supabase auth error messages to user-friendly messages
    const errorMessages: Record<string, string> = {
      'invalid_credentials': 'Invalid email or password',
      'user_not_found': 'User not found',
      'email_not_confirmed': 'Please confirm your email address',
      'email_taken': 'An account with this email already exists',
      'weak_password': 'Password is too weak. Use at least 6 characters',
      'rate_limit': 'Too many attempts. Please try again later',
      'network_error': 'Network error. Please check your connection',
    };

    const errorCode = error.code || '';
    const message = errorMessages[errorCode] || error.message || 'An error occurred';
    return new Error(message);
  }

  // Auth state listener
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
