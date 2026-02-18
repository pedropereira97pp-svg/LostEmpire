# Lost Empire

A React Native mobile game built with Expo, featuring authentication and in-game gameplay.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app on your mobile device (for physical device testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pedropereira97pp-svg/LostEmpire.git
cd LostEmpire
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS (macOS only)
npm run ios

# Android
npm run android

# Web
npm run web
```

Or scan the QR code with the Expo Go app on your mobile device.

## 📱 App Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx    # Main navigation setup
├── screens/
│   ├── LoginScreen.tsx     # Login and sign-up screen
│   ├── PlayerAccountScreen.tsx  # Player profile setup
│   └── InGameOverviewScreen.tsx  # Main game dashboard
├── services/
│   ├── auth.ts             # Authentication service (stub)
│   └── supabaseClient.ts   # Supabase client placeholder
└── theme/
    ├── colors.ts           # Color palette
    ├── spacing.ts          # Spacing constants
    ├── typography.ts       # Font sizes
    └── index.ts            # Theme exports
```

## 🔐 Authentication

The app currently uses a **stubbed authentication service** for demonstration purposes. This means:

- ✅ Any email/password combination works for sign-in
- ✅ Sign-up creates a local user session
- ✅ User data is stored locally using AsyncStorage
- ❌ No real authentication with a backend
- ❌ Data is not persisted across app reinstalls

### Demo Mode

To test the app without backend configuration:
- Enter any email and password
- Click "Sign In" or "Create Account"
- You'll be logged in and can explore all features

## 🔧 Supabase Configuration

To enable real authentication and data persistence, you need to configure Supabase:

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Wait for the project to be ready (usually takes 2-3 minutes)

### Step 2: Get Your Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL
   - anon/public API key

### Step 3: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 4: Update Configuration

Edit `src/services/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseConfig = {
  url: 'YOUR_SUPABASE_PROJECT_URL',  // Replace with actual URL
  anonKey: 'YOUR_SUPABASE_ANON_KEY',  // Replace with actual key
} as const;

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
```

### Step 5: Set Up Database Tables

Run these SQL queries in your Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stats
CREATE TABLE public.player_stats (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 100,
  gems INTEGER DEFAULT 10,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory
CREATE TABLE public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  rarity TEXT DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own stats"
  ON public.player_stats FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own stats"
  ON public.player_stats FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own inventory"
  ON public.inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.inventory FOR UPDATE
  USING (auth.uid() = user_id);
```

### Step 6: Update Auth Service

Replace the stubbed auth service with real Supabase authentication in `src/services/auth.ts`. The service should:

- Use `supabase.auth.signInWithPassword()` for sign-in
- Use `supabase.auth.signUp()` for sign-up
- Use `supabase.auth.signOut()` for sign-out
- Fetch user profiles from the `profiles` table
- Manage real sessions with Supabase

## 🎮 Features

### Login Screen
- Email and password authentication
- Sign-in and sign-up functionality
- Form validation
- Demo mode support

### Player Account Screen
- Profile customization
- Username display
- Display name and bio fields
- Sign-out functionality

### In-Game Overview Screen
- Player stats (level, gold, gems, XP)
- Battle record (wins/losses)
- Inventory management
- Recent activity feed
- Quick action buttons

## 🎨 Theme

The app uses a custom theme system with:

- **Colors**: Dark theme optimized for gaming
  - Primary: Indigo (#4F46E5)
  - Background: Dark gray (#111827)
  - Text: Light gray (#F9FAFB)
- **Spacing**: Consistent spacing scale (4px - 48px)
- **Typography**: Responsive font sizes (12px - 32px)

## 📦 Available Scripts

- `npm start` - Start the development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## ⚙️ Configuration Notes

### Expo Go Compatibility

The `app.json` configuration is optimized for **Expo Go** development. The following advanced Android flags have been removed to prevent boolean casting errors:

- ❌ `newArchEnabled` - React Native new architecture (not supported in Expo Go)
- ❌ `edgeToEdgeEnabled` - Android edge-to-edge display
- ❌ `predictiveBackGestureEnabled` - Android predictive back gesture

### Production Builds

When creating production builds with EAS Build or standalone apps, you can re-enable these features in `app.json`. 

**📖 For detailed configuration instructions, see [EXPO_CONFIG_GUIDE.md](./EXPO_CONFIG_GUIDE.md)**

Quick example for production:
```json
{
  "expo": {
    "newArchEnabled": true,
    "android": {
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": true
    }
  }
}
```

**Note**: These flags are only applicable for custom development builds or production builds, NOT for Expo Go.

## 🔮 Future Enhancements

- [ ] Real Supabase authentication integration
- [ ] Player profile persistence
- [ ] Inventory system with real database
- [ ] Battle system implementation
- [ ] Quest system
- [ ] Multiplayer features
- [ ] Push notifications
- [ ] In-app purchases
- [ ] Achievements system
- [ ] Leaderboards

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, open an issue in the GitHub repository or contact the development team.
