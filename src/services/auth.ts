import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

const AUTH_KEY = '@lostempire_auth';

// Stubbed authentication service
// This simulates authentication without making real network calls
// TODO: Replace with real Supabase auth when configured
class AuthService {
  private currentUser: User | null = null;

  async signIn(email: string, password: string): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Stub authentication - accepts any email/password for demo purposes
    // In production, this would call Supabase auth
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    this.currentUser = {
      id: 'stub-user-id',
      email,
      username: email.split('@')[0],
    };

    await this.saveAuthState(this.currentUser);
    return this.currentUser;
  }

  async signUp(email: string, password: string, username?: string): Promise<User> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    this.currentUser = {
      id: 'stub-user-id',
      email,
      username: username || email.split('@')[0],
    };

    await this.saveAuthState(this.currentUser);
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem(AUTH_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const authData = await AsyncStorage.getItem(AUTH_KEY);
      if (authData) {
        this.currentUser = JSON.parse(authData);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }

    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  private async saveAuthState(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }
}

export const authService = new AuthService();
