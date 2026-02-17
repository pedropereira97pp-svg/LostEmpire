# Project Structure

```
lost-empire/
├── App.tsx                          # Main app entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── .gitignore                       # Git ignore rules
├── .env.example                     # Environment variables template
├── README.md                        # Project documentation
├── SUPABASE_SETUP.md               # Supabase configuration guide
├── PROJECT_STRUCTURE.md           # This file
│
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx         # React Navigation setup with stack navigator
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Authentication screen (sign in/sign up)
│   │   ├── PlayerAccountScreen.tsx  # Player profile setup and customization
│   │   └── InGameOverviewScreen.tsx # Main game dashboard
│   │
│   ├── services/
│   │   ├── auth.ts                  # Authentication service (stubbed for demo)
│   │   └── supabaseClient.ts        # Supabase client placeholder
│   │
│   └── theme/
│       ├── colors.ts                # Color palette (dark theme)
│       ├── spacing.ts               # Spacing constants
│       ├── typography.ts            # Font sizes
│       └── index.ts                 # Theme exports
│
├── assets/                          # Static assets (images, icons)
├── node_modules/                    # Dependencies (ignored by git)
└── .git/                            # Git repository
```

## Key Features Implemented

### 1. Authentication Flow
- **LoginScreen.tsx**: Email/password authentication with sign-in and sign-up
- Demo mode accepts any email/password combination
- Form validation and error handling
- AsyncStorage for local session persistence

### 2. Player Account Setup
- **PlayerAccountScreen.tsx**: Profile customization
- Username, display name, and bio fields
- Sign-out functionality
- Navigation to game overview

### 3. In-Game Overview
- **InGameOverviewScreen.tsx**: Main game dashboard
- Player stats (level, gold, gems, XP)
- Battle record (wins/losses)
- Inventory management with rarity system
- Recent activity feed
- Action buttons for game features

### 4. Navigation
- **AppNavigator.tsx**: Stack-based navigation
- Three main screens: Login → PlayerAccount → InGameOverview
- Proper back button handling
- Dark-themed navigation bar

### 5. Theme System
- Dark theme optimized for gaming
- Consistent color palette with primary, secondary, and status colors
- Responsive spacing and typography
- Type-safe constants

### 6. Supabase Integration (Placeholder)
- Configuration file ready for real Supabase setup
- Stubbed auth service simulates authentication
- Comprehensive setup guide in SUPABASE_SETUP.md
- Environment variable template in .env.example

## Dependencies

### Core
- `expo` (~54.0.33): Expo framework
- `react` (19.1.0): React library
- `react-native` (0.81.5): React Native framework

### Navigation
- `@react-navigation/native` (^7.1.28): Navigation utilities
- `@react-navigation/native-stack` (^7.2.0): Stack navigator
- `react-native-screens` (^4.23.0): Native screen optimization
- `react-native-safe-area-context` (^5.6.2): Safe area handling

### Storage
- `@react-native-async-storage/async-storage` (^2.2.0): Local storage

### Development
- `typescript` (~5.9.2): TypeScript compiler
- `@types/react` (~19.1.0): React type definitions

## Design Decisions

### Navigation Choice
Used `@react-navigation/native-stack` (not `@react-navigation/stack`) because:
- Better performance with native navigation
- Smaller bundle size
- Better integration with native gestures
- Recommended for new projects

### Theme System
Centralized theme constants for:
- Easy customization
- Type safety
- Consistency across the app
- Dark theme optimization for gaming

### Auth Stub
Implemented a stubbed authentication service to:
- Allow immediate testing without backend setup
- Demonstrate the authentication flow
- Provide clear migration path to Supabase
- Use AsyncStorage for local persistence

### Screen Organization
Three-screen flow for:
- **Login**: Entry point and authentication
- **PlayerAccount**: Profile setup after auth
- **InGameOverview**: Main game interface

This flow provides clear separation of concerns and allows for future expansion.

## Next Steps

1. **Supabase Integration**: Follow SUPABASE_SETUP.md to configure real backend
2. **Game Features**: Implement battle system, quests, achievements
3. **Data Persistence**: Connect screens to real database
4. **Testing**: Add unit and integration tests
5. **Performance**: Optimize for production
6. **Deployment**: Build and publish to app stores

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios      # iOS (macOS only)
npm run android  # Android
npm run web      # Web browser
```

## Demo Mode

The app runs in demo mode by default:
- Any email/password works for authentication
- User data stored locally only
- No network calls required
- Perfect for testing UI/UX

To enable real authentication:
1. Set up Supabase project
2. Configure environment variables
3. Replace auth stub with real Supabase auth
4. See SUPABASE_SETUP.md for detailed instructions
