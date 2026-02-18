# Expo Configuration Guide

## Overview

This guide explains the Expo configuration choices made for this project and how to adjust them for different deployment scenarios.

## Current Configuration

The `app.json` file is configured for **Expo Go** compatibility. This means the app can be tested immediately using the Expo Go client without building custom native binaries.

### Removed Flags

The following flags have been removed to prevent Android boolean casting errors in Expo Go:

#### 1. `newArchEnabled`
- **What it does**: Enables React Native's new architecture (Fabric renderer and TurboModules)
- **Why removed**: Not supported in Expo Go
- **When to use**: Only in custom development builds or production builds

#### 2. `android.edgeToEdgeEnabled`
- **What it does**: Enables Android edge-to-edge display mode (content draws behind system bars)
- **Why removed**: Can cause boolean casting errors in Expo Go
- **When to use**: Production builds where you want immersive UI

#### 3. `android.predictiveBackGestureEnabled`
- **What it does**: Enables Android 13+ predictive back gesture animations
- **Why removed**: Can cause boolean casting errors in Expo Go
- **When to use**: Production builds targeting Android 13+

## Development Scenarios

### Scenario 1: Expo Go Development (Current)

**Best for**: Rapid prototyping, testing on physical devices without building

**Configuration**: Keep the current `app.json` as-is

**Run commands**:
```bash
npm start
# Then scan QR code with Expo Go app
```

**Limitations**:
- Cannot use native modules that aren't in Expo Go
- Cannot use new architecture features
- Some Android features limited

### Scenario 2: Custom Development Build

**Best for**: Testing with custom native modules or advanced features

**Configuration**: Create `eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

Update `app.json`:
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

**Run commands**:
```bash
eas build --profile development --platform android
# Install the .apk on your device
npx expo start --dev-client
```

### Scenario 3: Production Build

**Best for**: App store distribution

**Configuration**: Same as custom development build, plus:

Update `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.lostempire",
      "versionCode": 1,
      "permissions": []
    }
  }
}
```

**Run commands**:
```bash
eas build --platform android --profile production
```

## Common Issues & Solutions

### Issue: "Boolean casting error" in Expo Go

**Cause**: Using build-time flags that Expo Go doesn't support

**Solution**: Remove or comment out these flags:
- `newArchEnabled`
- `android.edgeToEdgeEnabled`
- `android.predictiveBackGestureEnabled`

### Issue: Feature not working in Expo Go

**Cause**: Feature requires custom native code

**Solution**: Create a custom development build with EAS Build

### Issue: App crashes immediately after launch

**Cause**: Incompatible native modules or incorrect configuration

**Solution**:
1. Check `app.json` for syntax errors
2. Ensure all dependencies are compatible with your Expo SDK version
3. Clear cache: `npx expo start --clear`

## Configuration Reference

### Essential Fields

```json
{
  "expo": {
    "name": "App Name",           // Display name
    "slug": "app-slug",            // URL-safe identifier
    "version": "1.0.0",            // App version
    "orientation": "portrait",     // Screen orientation
    "icon": "./assets/icon.png",   // App icon (1024x1024)
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

### Android-Specific Fields

```json
{
  "expo": {
    "android": {
      "package": "com.example.app",        // Bundle identifier
      "versionCode": 1,                     // Build number
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [],                    // Android permissions
      "edgeToEdgeEnabled": false,          // Edge-to-edge display
      "predictiveBackGestureEnabled": false // Predictive back
    }
  }
}
```

### iOS-Specific Fields

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.example.app",  // Bundle identifier
      "buildNumber": "1.0.0",                  // Build number
      "supportsTablet": true                   // iPad support
    }
  }
}
```

## Best Practices

1. **Start with Expo Go**: Develop and test with minimal config first
2. **Add features gradually**: Enable advanced features only when needed
3. **Test on real devices**: Emulators don't catch all issues
4. **Version control**: Commit `app.json` changes with clear messages
5. **Document changes**: Note why specific flags are enabled/disabled

## Additional Resources

- [Expo Configuration Reference](https://docs.expo.dev/versions/latest/config/app/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Android Edge-to-Edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)

## Support

If you encounter configuration issues:
1. Check the [Expo Forums](https://forums.expo.dev/)
2. Search [GitHub Issues](https://github.com/expo/expo/issues)
3. Consult the [Expo Discord](https://chat.expo.dev/)
