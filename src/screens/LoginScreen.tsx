import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { authService } from '../services/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  PlayerAccount: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      setAuthError('Please enter your email');
      return false;
    }
    if (!password.trim()) {
      setAuthError('Please enter your password');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setAuthError(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      navigation.replace('PlayerAccount');
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setAuthError(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUp(email.trim(), password);
      Alert.alert(
        'Account Created',
        'Your account has been created successfully!',
        [{ text: 'OK', onPress: () => navigation.replace('PlayerAccount') }]
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Sign up failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Lost Empire</Text>
          <Text style={styles.subtitle}>Welcome back, commander</Text>
        </View>

        <View style={styles.form}>
          {authError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setAuthError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setAuthError(null);
              }}
              secureTextEntry
              editable={!isLoading}
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure authentication powered by Supabase
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.md,
    color: colors.text,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
