import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { colors, spacing, typography } from '../theme';
import { authService } from '../services/auth';
import { getRateLimitStatus } from '../services/authRateLimit';
import { validateEmail, validatePasswordStrength, PASSWORD_RULES } from '../utils/validation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  PlayerAccount: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Tab = 'login' | 'create';
type ForgotState = 'idle' | 'sent';

export default function LoginScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [forgotState, setForgotState] = useState<ForgotState>('idle');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [canAttempt, setCanAttempt] = useState(true);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkRateLimit();
    return () => {
      if (lockoutTimer.current) clearInterval(lockoutTimer.current);
    };
  }, []);

  const checkRateLimit = async () => {
    const status = await getRateLimitStatus();
    setCanAttempt(status.canAttempt);
    if (!status.canAttempt) {
      setLockoutSeconds(status.secondsRemaining);
      startLockoutCountdown();
    }
  };

  const startLockoutCountdown = () => {
    if (lockoutTimer.current) clearInterval(lockoutTimer.current);
    lockoutTimer.current = setInterval(async () => {
      const status = await getRateLimitStatus();
      setCanAttempt(status.canAttempt);
      setLockoutSeconds(status.secondsRemaining);
      if (status.canAttempt) {
        if (lockoutTimer.current) clearInterval(lockoutTimer.current);
      }
    }, 1000);
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError('');
    setForgotState('idle');
    setSignUpSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  const validateLoginForm = (): boolean => {
    let valid = true;

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const validateCreateForm = (): boolean => {
    let valid = true;

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (!validatePasswordStrength(password)) {
      setPasswordError('Password does not meet all requirements');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    setFormError('');
    if (!validateLoginForm()) return;

    const status = await getRateLimitStatus();
    if (!status.canAttempt) {
      setCanAttempt(false);
      setLockoutSeconds(status.secondsRemaining);
      startLockoutCountdown();
      setFormError(`Too many failed attempts. Try again in ${status.secondsRemaining}s.`);
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      navigation.replace('PlayerAccount');
    } catch (error: any) {
      setFormError(error.message || 'Login failed. Please try again.');
      const newStatus = await getRateLimitStatus();
      if (!newStatus.canAttempt) {
        setCanAttempt(false);
        setLockoutSeconds(newStatus.secondsRemaining);
        startLockoutCountdown();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setFormError('');
    if (!validateCreateForm()) return;

    setIsLoading(true);
    try {
      const result = await authService.signUp(email.trim(), password);
      if (result.requiresConfirmation) {
        setSignUpSuccess(true);
      } else {
        navigation.replace('PlayerAccount');
      }
    } catch (error: any) {
      setFormError(error.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError('Enter your email address to reset your password');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setIsSendingReset(true);
    setFormError('');
    try {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'lostempire', path: 'reset-password' });
      await authService.resetPasswordForEmail(email.trim(), redirectTo);
      setForgotState('sent');
    } catch (error: any) {
      setFormError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    setIsLoading(true);
    try {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'lostempire', path: 'auth/callback' });
      await authService.signInWithGoogle(redirectTo);
    } catch (error: any) {
      setFormError(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !canAttempt;

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
          <Text style={styles.subtitle}>Command your destiny</Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'login' && styles.tabActive]}
            onPress={() => switchTab('login')}
          >
            <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.tabActive]}
            onPress={navigateToSignup}
          >
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {signUpSuccess ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successText}>
                We sent a confirmation link to{' '}
                <Text style={styles.successEmail}>{email}</Text>. Please confirm your email before signing in.
              </Text>
              <TouchableOpacity onPress={() => switchTab('login')}>
                <Text style={styles.switchLink}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {!!formError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              )}

              {!canAttempt && (
                <View style={styles.lockoutBanner}>
                  <Text style={styles.lockoutText}>
                    Too many failed attempts. Try again in {lockoutSeconds}s.
                  </Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, !!emailError && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); setFormError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  autoComplete="email"
                  returnKeyType="next"
                />
                {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, !!passwordError && styles.inputError]}
                    placeholder={activeTab === 'login' ? 'Enter your password' : 'Create a password'}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(''); setFormError(''); }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    autoComplete={activeTab === 'login' ? 'password' : 'new-password'}
                    returnKeyType={activeTab === 'login' ? 'done' : 'next'}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
              </View>

              {activeTab === 'create' && (
                <>
                  <View style={styles.strengthContainer}>
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <View key={rule.label} style={styles.ruleRow}>
                          <Text style={[styles.ruleIcon, passed ? styles.rulePassed : styles.ruleFailed]}>
                            {passed ? '✓' : '○'}
                          </Text>
                          <Text style={[styles.ruleLabel, passed ? styles.rulePassed : styles.ruleFailed]}>
                            {rule.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, !!confirmPasswordError && styles.inputError]}
                        placeholder="Re-enter your password"
                        placeholderTextColor={colors.textSecondary}
                        value={confirmPassword}
                        onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(''); setFormError(''); }}
                        secureTextEntry={!showConfirmPassword}
                        editable={!isLoading}
                        autoComplete="new-password"
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirmPassword((v) => !v)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                    </View>
                    {!!confirmPasswordError && <Text style={styles.fieldError}>{confirmPasswordError}</Text>}
                  </View>
                </>
              )}

              {activeTab === 'login' && (
                <View style={styles.forgotRow}>
                  {forgotState === 'idle' ? (
                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      disabled={isSendingReset || isLoading}
                    >
                      {isSendingReset ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.forgotSent}>
                      ✓ Reset link sent — check your inbox.
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, isDisabled && styles.buttonDisabled]}
                onPress={activeTab === 'login' ? handleLogin : handleCreateAccount}
                disabled={isDisabled}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              {activeTab === 'login' && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={[styles.googleButton, isDisabled && styles.buttonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={isDisabled}
                  >
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure authentication powered by Supabase</Text>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  lockoutBanner: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lockoutText: {
    color: colors.warning,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: spacing.md,
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
  inputError: {
    borderColor: colors.error,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  fieldError: {
    color: colors.error,
    fontSize: typography.xs,
    marginTop: spacing.xs,
  },
  strengthContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ruleIcon: {
    fontSize: typography.sm,
    marginRight: spacing.xs,
    width: 16,
    textAlign: 'center',
  },
  ruleLabel: {
    fontSize: typography.xs,
  },
  rulePassed: {
    color: colors.success,
  },
  ruleFailed: {
    color: colors.textSecondary,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.xs,
  },
  forgotLink: {
    fontSize: typography.sm,
    color: colors.primary,
  },
  forgotSent: {
    fontSize: typography.sm,
    color: colors.success,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: typography.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 50,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  googleIcon: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: typography.md,
    fontWeight: '600',
    color: colors.text,
  },
  successContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  successEmail: {
    color: colors.primary,
    fontWeight: '600',
  },
  switchLink: {
    fontSize: typography.md,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
