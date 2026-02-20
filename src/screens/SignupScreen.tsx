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
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { authService } from '../services';
import { validateEmail, validatePasswordStrength, PASSWORD_RULES } from '../utils/validation';
import type { RootStackScreenProps } from '../navigation';

type Props = RootStackScreenProps<'Signup'>;

type SignupStep = 'email' | 'otp' | 'password';

export default function SignupScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (resendTimer.current) clearInterval(resendTimer.current);
    };
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimer.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendTimer.current) clearInterval(resendTimer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [resendCooldown]);

  const validateEmailInput = (): boolean => {
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

    return valid;
  };

  const validateOtpInput = (): boolean => {
    let valid = true;

    if (!otp.trim()) {
      setOtpError('Verification code is required');
      valid = false;
    } else if (otp.length !== 6) {
      setOtpError('Enter the 6-digit verification code');
      valid = false;
    } else {
      setOtpError('');
    }

    return valid;
  };

  const validatePasswordForm = (): boolean => {
    let valid = true;

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

  const handleSendOtp = async () => {
    setFormError('');
    if (!validateEmailInput()) return;

    setIsLoading(true);
    try {
      await authService.requestEmailOtp(email);
      setOtpSent(true);
      setResendCooldown(60);
      setCurrentStep('otp');
      setSuccessMessage(`Verification code sent to ${email}`);
    } catch (error: any) {
      setFormError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setFormError('');
    setIsLoading(true);
    try {
      await authService.requestEmailOtp(email);
      setResendCooldown(60);
      setSuccessMessage('New verification code sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setFormError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError('');
    if (!validateOtpInput()) return;

    setIsLoading(true);
    try {
      await authService.verifyEmailOtp(email, otp);
      setSuccessMessage('Email verified successfully!');
      setCurrentStep('password');
    } catch (error: any) {
      setOtpError(error.message || 'Invalid or expired verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async () => {
    setFormError('');
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    try {
      await authService.setPassword(password);
      // Get current user and navigate to appropriate screen
      const user = await authService.getCurrentUser();
      // Navigate based on username - if user has username, go to game, else go to player account
      if (user && user.username) {
        navigation.replace('InGameOverview');
      } else {
        navigation.replace('PlayerAccount');
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmail = () => {
    setCurrentStep('email');
    setOtp('');
    setOtpError('');
    setSuccessMessage('');
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'email', label: 'Email', completed: currentStep !== 'email' },
      { key: 'otp', label: 'Verify', completed: currentStep === 'password' },
      { key: 'password', label: 'Password', completed: false },
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep === step.key && styles.stepCircleActive,
                step.completed && styles.stepCircleCompleted,
              ]}
            >
              {step.completed ? (
                <Text style={styles.stepCheckmark}>✓</Text>
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep === step.key && styles.stepNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === step.key && styles.stepLabelActive,
                step.completed && styles.stepLabelCompleted,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  step.completed && styles.stepConnectorCompleted,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderEmailStep = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Enter your email</Text>
      <Text style={styles.stepSubtitle}>
        We'll send you a verification code to confirm your email address.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email Address</Text>
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

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.primaryButtonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOtpStep = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Check your email</Text>
      <Text style={styles.stepSubtitle}>
        We sent a 6-digit verification code to{' '}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={[styles.input, styles.otpInput, !!otpError && styles.inputError]}
          placeholder="123456"
          placeholderTextColor={colors.textSecondary}
          value={otp}
          onChangeText={(t) => { 
            const numericValue = t.replace(/[^0-9]/g, '').slice(0, 6);
            setOtp(numericValue);
            setOtpError('');
            setFormError('');
          }}
          keyboardType="numeric"
          maxLength={6}
          editable={!isLoading}
          autoComplete="one-time-code"
          returnKeyType="done"
        />
        {!!otpError && <Text style={styles.fieldError}>{otpError}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (isLoading || otp.length !== 6) && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.primaryButtonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>
          Didn't receive the code?{' '}
        </Text>
        {resendCooldown > 0 ? (
          <Text style={styles.resendCooldown}>Resend in {resendCooldown}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={handleEditEmail} style={styles.editEmailContainer}>
        <Text style={styles.editEmailLink}>✏️ Edit email address</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Set your password</Text>
      <Text style={styles.stepSubtitle}>
        Create a secure password to complete your account setup.
      </Text>

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
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, !!passwordError && styles.inputError]}
            placeholder="Create a strong password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(''); setFormError(''); }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            autoComplete="new-password"
            returnKeyType="next"
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

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleSetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.primaryButtonText}>Complete Sign Up</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Lost Empire</Text>
        </View>

        {renderStepIndicator()}

        {!!formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        {!!successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        )}

        {currentStep === 'email' && renderEmailStep()}
        {currentStep === 'otp' && renderOtpStep()}
        {currentStep === 'password' && renderPasswordStep()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNumber: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: colors.primary,
  },
  stepCheckmark: {
    fontSize: typography.sm,
    fontWeight: 'bold',
    color: colors.text,
  },
  stepLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: colors.success,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  stepConnectorCompleted: {
    backgroundColor: colors.success,
  },
  form: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emailHighlight: {
    color: colors.primary,
    fontWeight: '600',
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
  successBanner: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    color: colors.success,
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
  otpInput: {
    textAlign: 'center',
    fontSize: typography.lg,
    letterSpacing: 8,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resendText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  resendCooldown: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  resendLink: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  editEmailContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  editEmailLink: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '600',
  },
});