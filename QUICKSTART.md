# Quick Start Guide

Get the Lost Empire app up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo Go app on your mobile device OR
  - iOS Simulator (macOS only)
  - Android Emulator

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm start
```

This will start the Expo development server and show a QR code.

### 3. Run the App

Choose one of these options:

#### Option A: Physical Device (Easiest)
1. Install Expo Go from App Store (iOS) or Google Play (Android)
2. Scan the QR code with Expo Go
3. The app will load on your device

#### Option B: iOS Simulator (macOS only)
```bash
npm run ios
```

#### Option C: Android Emulator
```bash
npm run android
```

#### Option D: Web Browser
```bash
npm run web
```

## Testing the App

### Demo Mode (No Setup Required)

The app works in demo mode immediately:

1. **Login Screen**
   - Enter any email (e.g., `test@example.com`)
   - Enter any password (e.g., `password123`)
   - Click "Sign In" or "Create Account"
   - You'll be logged in!

2. **Player Account Screen**
   - See your profile information
   - Enter a username
   - Click "Continue to Game"

3. **In-Game Overview**
   - Explore the game dashboard
   - View player stats, inventory, and activities
   - Try the action buttons (placeholder functionality)

### What Works in Demo Mode

✅ Authentication (sign in/sign up)
✅ Profile creation and editing
✅ Local session persistence (using AsyncStorage)
✅ Navigation between screens
✅ All UI components
✅ Theme system

### What Doesn't Work in Demo Mode

❌ Real backend authentication
❌ Data persistence across devices
❌ Real-time features
❌ Social features
❌ Multiplayer battles

## Setting Up Real Backend (Optional)

To enable real authentication and data persistence:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings → API
4. Copy `.env.example` to `.env` and fill in your credentials
5. Follow the detailed instructions in `SUPABASE_SETUP.md`

## Common Issues

### "Module not found" Errors

Run:
```bash
npm install
```

### TypeScript Errors

Run:
```bash
npx tsc --noEmit
```

If errors persist, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Expo Server Won't Start

1. Make sure port 19000-19002 are available
2. Try clearing Expo cache: `expo start -c`
3. Restart your terminal

### Can't Connect to Device

1. Make sure your device and computer are on the same Wi-Fi network
2. Try using "Connection" tab in Expo Go and enter the LAN URL manually
3. Restart the Expo dev server

## Development Tips

### Hot Reloading

The app supports hot reload - changes to code will automatically update in your app.

### Debugging

Shake your device (or press Cmd+D on iOS simulator, Ctrl+M on Android) to open the developer menu for debugging options.

### Running Tests

```bash
# Type checking
npx tsc --noEmit

# Start with cache cleared
expo start -c
```

## Project Structure

```
src/
├── navigation/     # Navigation setup
├── screens/        # App screens (Login, PlayerAccount, InGameOverview)
├── services/       # Auth and Supabase services
└── theme/          # Colors, spacing, typography
```

See `PROJECT_STRUCTURE.md` for more details.

## Next Steps

1. ✅ Get the app running (you're here!)
2. 📖 Read the full documentation in `README.md`
3. 🔧 Set up Supabase for real backend (see `SUPABASE_SETUP.md`)
4. 🎮 Start building game features!
5. 🧪 Add tests
6. 🚀 Prepare for deployment

## Support

- GitHub Issues: Report bugs or request features
- Documentation: Check `README.md` and `SUPABASE_SETUP.md`
- Expo Docs: [docs.expo.dev](https://docs.expo.dev)

## Enjoy Building Lost Empire! 🎮
