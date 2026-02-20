import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { authService, UserProfile } from './auth';

/**
 * Centralized navigation helper for authentication state changes.
 * Handles routing based on user profile state and username.
 */
export class AuthNavigationService {
  /**
   * Navigate to the appropriate screen based on authentication state.
   * @param navigation - Stack navigation prop
   * @param user - User profile from auth service
   */
  static navigateToAuthenticatedScreen(
    navigation: NativeStackNavigationProp<RootStackParamList>,
    user: UserProfile | null
  ): void {
    if (!user) {
      navigation.replace('Login');
      return;
    }

    // If user has a username, go directly to InGameOverview
    // Otherwise, go to PlayerAccount to set up profile
    if (user.username) {
      navigation.replace('InGameOverview');
    } else {
      navigation.replace('PlayerAccount');
    }
  }

  /**
   * Handle sign-out and navigate to login screen.
   * @param navigation - Stack navigation prop
   */
  static handleSignOut(
    navigation: NativeStackNavigationProp<RootStackParamList>
  ): Promise<void> {
    return authService.signOut().then(() => {
      navigation.replace('Login');
    });
  }

  /**
   * Navigate to player account screen.
   * @param navigation - Stack navigation prop
   */
  static goToPlayerAccount(
    navigation: NativeStackNavigationProp<RootStackParamList>
  ): void {
    navigation.replace('PlayerAccount');
  }

  /**
   * Navigate to game overview screen.
   * @param navigation - Stack navigation prop
   */
  static goToGameOverview(
    navigation: NativeStackNavigationProp<RootStackParamList>
  ): void {
    navigation.replace('InGameOverview');
  }

  /**
   * Check if user should skip profile setup and go directly to game.
   * @param user - User profile
   * @returns true if user should go to game, false if needs profile setup
   */
  static shouldSkipProfileSetup(user: UserProfile | null): boolean {
    return !!(user && user.username);
  }
}

/**
 * Helper function to generate a short player tag from username.
 * Takes the first 8 characters and adds a # if needed.
 * @param username - Full username
 * @returns Short player tag
 */
export function generatePlayerTag(username?: string): string {
  if (!username) {
    return 'Guest';
  }

  // If username is already short enough, use it as-is
  if (username.length <= 8) {
    return username;
  }

  // Otherwise, truncate and add indicator
  return `${username.substring(0, 8)}...`;
}

/**
 * Helper function to generate a player display tag with ID.
 * Format: username#1234
 * @param username - Full username
 * @param userId - User ID
 * @returns Player tag with ID
 */
export function generatePlayerTagWithId(
  username?: string,
  userId?: string
): string {
  if (!username) {
    return 'Guest';
  }

  const shortUsername = username.length > 12 ? username.substring(0, 12) : username;
  const shortId = userId ? userId.substring(0, 4) : '0000';
  return `${shortUsername}#${shortId}`;
}
