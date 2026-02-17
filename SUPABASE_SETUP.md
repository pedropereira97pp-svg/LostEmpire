# Supabase Setup Guide

This guide provides detailed instructions for configuring Supabase with the Lost Empire app.

## Overview

The app currently uses a stubbed authentication service for demonstration. To enable real authentication and data persistence, follow these steps to set up Supabase.

## Step 1: Install Supabase Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 2: Create a Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in the project details:
   - Name: `lost-empire` (or your preferred name)
   - Database Password: Generate a strong password and save it
   - Region: Choose the region closest to your users
4. Wait for the project to be provisioned (2-3 minutes)

## Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:
- Project Settings → API → Project URL
- Project Settings → API → anon/public key

**Important:** Add `.env` to your `.gitignore` file to avoid committing sensitive credentials!

## Step 4: Update Supabase Client

Replace the contents of `src/services/supabaseClient.ts` with:

```typescript
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

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
```

## Step 5: Set Up Database Tables

Open the Supabase SQL Editor and run the following queries:

### 5.1 Create Profiles Table

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.2 Create Player Stats Table

```sql
CREATE TABLE public.player_stats (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 100,
  gems INTEGER DEFAULT 10,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  battles_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own stats"
  ON public.player_stats FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own stats"
  ON public.player_stats FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own stats"
  ON public.player_stats FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger for automatic stats creation
CREATE OR REPLACE FUNCTION public.handle_new_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_player_stats();
```

### 5.3 Create Inventory Table

```sql
CREATE TABLE public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER DEFAULT 1,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own inventory"
  ON public.inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_inventory_user_id ON public.inventory(user_id);
```

### 5.4 Create Activities Table

```sql
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('battle', 'quest', 'achievement', 'purchase')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_activities_user_id ON public.activities(user_id DESC);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
```

## Step 6: Update Auth Service

Replace `src/services/auth.ts` with real Supabase authentication:

```typescript
import { supabase } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
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
      throw error;
    }

    await this.setSession(data.session);
    return this.currentUser!;
  }

  async signUp(email: string, password: string, username?: string): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Profile will be created automatically by trigger
    await this.setSession(data.session);
    return this.currentUser!;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.currentSession = null;
    this.currentUser = null;
  }

  async getCurrentSession(): Promise<Session | null> {
    if (this.currentSession) {
      return this.currentSession;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await this.setSession(session);
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
      throw error;
    }

    this.currentUser = profile;
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  private async setSession(session: Session | null): Promise<void> {
    this.currentSession = session;
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      this.currentUser = profile;
    }
  }

  // Auth state listener
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession = session;
      callback(session);
    });
  }
}

export const authService = new AuthService();
```

## Step 7: Test Your Setup

1. Restart your development server:
   ```bash
   npm start
   ```

2. Try signing up with a new account
3. Check the Supabase Dashboard → Authentication to see the user
4. Check the Supabase Dashboard → Table Editor to see the profile and stats

## Troubleshooting

### "Invalid JWT" Errors

Make sure your environment variables are set correctly and the app has been restarted.

### RLS Policy Errors

Check that your Row Level Security policies are correctly set up and that the user ID matches.

### Database Connection Issues

Verify your Supabase project URL and anon key are correct. Check the Supabase status page for outages.

### Profile Not Created

Ensure the trigger `on_auth_user_created` is properly set up. Check the Database → Triggers section in Supabase.

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Enable Row Level Security on all tables
- Use the anon key for client-side operations
- Never expose your service_role key in client code

## Next Steps

After setting up Supabase, you can:

1. Implement real-time features with Supabase Realtime
2. Add file storage for user avatars
3. Implement social authentication (Google, Apple, etc.)
4. Set up edge functions for complex backend logic
5. Add database backups and replication

For more information, visit the [Supabase documentation](https://supabase.com/docs).
