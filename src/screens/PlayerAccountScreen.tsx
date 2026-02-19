import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { authService, UserProfile } from '../services/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  PlayerAccount: undefined;
  InGameOverview: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PlayerAccount'>;

export default function PlayerAccountScreen({ navigation }: Props) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setError(null);
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigation.replace('Login');
        return;
      }
      setUser(currentUser);
      setUsername(currentUser.username || '');
      setDisplayName(currentUser.display_name || '');
      setBio(currentUser.bio || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await authService.updateProfile({
        username: username.trim(),
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      navigation.replace('InGameOverview');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              navigation.replace('Login');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Player Account</Text>
        <Text style={styles.subtitle}>Customize your profile</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadUserData}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Player ID</Text>
          <Text style={styles.value}>{user?.id}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            maxLength={30}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter display name (optional)"
            placeholderTextColor={colors.textSecondary}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={50}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself (optional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={bio}
            onChangeText={setBio}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{bio.length}/500</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, isSaving && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={isSaving}
      >
        <Text style={styles.continueButtonText}>
          {isSaving ? 'Saving...' : 'Continue to Game'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: typography.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.md,
    color: colors.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: typography.sm,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.md,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  form: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  continueButtonText: {
    fontSize: typography.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  signOutButtonText: {
    fontSize: typography.md,
    color: colors.error,
  },
});
