# Lost Empire

A React Native mobile game built with Expo, featuring real Supabase authentication and in-game gameplay.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app on your mobile device (for physical device testing)
- A Supabase account (for authentication)

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

3. Set up Supabase:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your Supabase credentials (see [Supabase Setup](#supabase-setup) below)

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
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
│   ├── auth.ts             # Supabase authentication service
│   └── supabaseClient.ts   # Supabase client configuration
└── theme/
    ├── colors.ts           # Color palette
    ├── spacing.ts          # Spacing constants
    ├── typography.ts       # Font sizes
    └── index.ts            # Theme exports
```

## 🔐 Authentication

The app uses **Supabase Authentication** for secure user management:

- ✅ Real email/password authentication
- ✅ Automatic session persistence
- ✅ Profile creation on signup
- ✅ Secure password requirements (min 6 characters)
- ✅ Proper error handling and user feedback

### Supabase Setup

To enable authentication, you need to configure Supabase:

#### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Wait for the project to be ready (usually takes 2-3 minutes)

#### Step 2: Get Your Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL
   - anon/public API key

#### Step 3: Configure Environment Variables

Edit the `.env` file in your project root:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Step 4: Set Up Database Tables

Run these SQL queries in your Supabase SQL Editor:

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
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
```

For complete database setup including player stats and inventory, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 🎮 Features

### Login Screen
- Email and password authentication
- Sign-in and sign-up functionality
- Form validation with clear error messages
- Password requirements enforcement

### Player Account Screen
- Profile customization
- Username, display name, and bio
- Real-time profile updates
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

### Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |

**⚠️ Never commit your `.env` file to version control!**

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

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Enable Row Level Security on all tables
- Use the anon key for client-side operations
- Never expose your service_role key in client code

## 🔮 Future Enhancements

- [ ] Real-time features with Supabase Realtime
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

## 📚 Additional Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Complete Supabase configuration guide
- [EXPO_CONFIG_GUIDE.md](./EXPO_CONFIG_GUIDE.md) - Expo configuration reference
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project structure
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
