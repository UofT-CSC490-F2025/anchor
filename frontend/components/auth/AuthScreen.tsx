/**
 * Authentication Screen
 * Login and Signup functionality with consistent UI design
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton } from '@/components/ui/AccessibleComponents';
import { AuthInput, SocialLoginButton, ErrorAlert } from './AuthComponents';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

type AuthMode = 'login' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time validation states
  const [validationState, setValidationState] = useState({
    email: { isValid: false, error: '' },
    password: { isValid: false, error: '' },
    firstName: { isValid: false, error: '' },
    lastName: { isValid: false, error: '' },
    confirmPassword: { isValid: false, error: '' },
  });

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const { login, signup, loginWithOAuth, error, clearError } = useAuth();

  // Real-time validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateName = (name: string) => {
    return name.trim().length >= 2;
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Update validation state on input change
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const isValid = validateEmail(text);
    setValidationState(prev => ({
      ...prev,
      email: { isValid, error: !isValid && text ? 'Please enter a valid email address' : '' }
    }));
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    const isValid = validateName(text);
    setValidationState(prev => ({
      ...prev,
      firstName: { isValid, error: !isValid && text ? 'First name must be at least 2 characters' : '' }
    }));
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    const isValid = validateName(text);
    setValidationState(prev => ({
      ...prev,
      lastName: { isValid, error: !isValid && text ? 'Last name must be at least 2 characters' : '' }
    }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const isValid = validatePassword(text);
    setValidationState(prev => ({
      ...prev,
      password: { isValid, error: !isValid && text ? 'Password must be at least 6 characters' : '' },
      // Also revalidate confirm password if it has a value
      confirmPassword: confirmPassword ? {
        isValid: text === confirmPassword && confirmPassword.length > 0,
        error: text !== confirmPassword && confirmPassword ? 'Passwords do not match' : ''
      } : prev.confirmPassword
    }));
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    const isValid = text === password && text.length > 0;
    setValidationState(prev => ({
      ...prev,
      confirmPassword: { isValid, error: !isValid && text ? 'Passwords do not match' : '' }
    }));
  };

  const handleSubmit = async () => {
    // Clear any previous errors
    clearError();

    // Enhanced validation with better error messages
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email address is required');
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Password is required');
      return;
    }

    // Email validation with more descriptive error
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    if (mode === 'signup') {
      if (!firstName.trim()) {
        Alert.alert('Validation Error', 'First name is required');
        return;
      }
      if (firstName.trim().length < 2) {
        Alert.alert('Validation Error', 'First name must be at least 2 characters long');
        return;
      }
      if (!lastName.trim()) {
        Alert.alert('Validation Error', 'Last name is required');
        return;
      }
      if (lastName.trim().length < 2) {
        Alert.alert('Validation Error', 'Last name must be at least 2 characters long');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Validation Error', 'Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Validation Error', 'Passwords do not match. Please ensure both password fields are identical');
        return;
      }
      // Password strength validation (warning, not blocking)
      if (!/(?=.*[a-z])(?=.*[A-Z])|(?=.*\d)/.test(password)) {
        Alert.alert('Password Recommendation', 'For better security, consider using a password with at least one uppercase letter or one number', [
          { text: 'Continue Anyway', style: 'default' },
          { text: 'Improve Password', style: 'cancel' },
        ]);
      }
    } else {
      // Login-specific validation
      if (password.length < 6) {
        Alert.alert('Validation Error', 'Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, firstName.trim(), lastName.trim());
      }
    } catch (err) {
      // Error handling is managed by the auth context
      console.error('Authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    setLoading(true);
    try {
      // Mock OAuth token for development
      const mockToken = `mock_${provider}_token_${Date.now()}`;
      await loginWithOAuth(provider, mockToken);
    } catch (err) {
      console.error('Social login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    // Clear form fields when switching modes
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    // Clear validation states
    setValidationState({
      email: { isValid: false, error: '' },
      password: { isValid: false, error: '' },
      firstName: { isValid: false, error: '' },
      lastName: { isValid: false, error: '' },
      confirmPassword: { isValid: false, error: '' },
    });
  };

  return (
    <ResponsiveContainer style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              style={styles.logoContainer}
            >
              <AccessibleText style={styles.logoText}>📊</AccessibleText>
            </LinearGradient>
            
            <AccessibleText 
              variant="heading1" 
              style={StyleSheet.flatten([styles.title, { color: theme.text }])}
              accessibilityRole="header"
            >
              Anchor
            </AccessibleText>
            
            <AccessibleText 
              variant="body" 
              style={StyleSheet.flatten([styles.subtitle, { color: theme.textSecondary }])}
            >
              AI-powered content monitoring and analysis
            </AccessibleText>
          </View>

          {/* Auth Form */}
          <View style={StyleSheet.flatten([styles.formContainer, { backgroundColor: theme.card, ...Elevation.md }])}>
            <View style={styles.formHeader}>
              <AccessibleText 
                variant="heading2" 
                style={StyleSheet.flatten([styles.formTitle, { color: theme.text }])}
              >
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </AccessibleText>
              <AccessibleText 
                variant="body" 
                style={StyleSheet.flatten([styles.formSubtitle, { color: theme.textSecondary }])}
              >
                {mode === 'login' 
                  ? 'Sign in to access your dashboard' 
                  : 'Join us to start monitoring your content'
                }
              </AccessibleText>
            </View>

            {/* Error Display */}
            <ErrorAlert 
              error={error} 
              onDismiss={clearError}
            />

            {/* Form Fields */}
            <View style={styles.formFields}>
              {mode === 'signup' && (
                <>
                  <View style={styles.nameFieldsContainer}>
                    <AccessibleText 
                      variant="caption" 
                      style={StyleSheet.flatten([styles.helperText, { color: theme.textSecondary }])}
                    >
                      Please enter your legal first and last name as they appear on official documents
                    </AccessibleText>
                  </View>
                  <AuthInput
                    label="First Name"
                    value={firstName}
                    onChangeText={handleFirstNameChange}
                    placeholder="e.g., John"
                    autoCapitalize="words"
                    textContentType="givenName"
                    required
                    isValid={validationState.firstName.isValid}
                    error={validationState.firstName.error}
                  />
                  <AuthInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={handleLastNameChange}
                    placeholder="e.g., Smith"
                    autoCapitalize="words"
                    textContentType="familyName"
                    required
                    isValid={validationState.lastName.isValid}
                    error={validationState.lastName.error}
                  />
                </>
              )}

              <AuthInput
                label="Email"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                required
                isValid={validationState.email.isValid}
                error={validationState.email.error}
              />

              <AuthInput
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                secureTextEntry
                textContentType={mode === 'login' ? 'password' : 'newPassword'}
                required
                isValid={validationState.password.isValid}
                error={validationState.password.error}
                {...(mode === 'signup' && { helperText: 'For better security, use uppercase, lowercase, and numbers' })}
              />

              {mode === 'signup' && (
                <AuthInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Re-enter your password"
                  secureTextEntry
                  textContentType="newPassword"
                  required
                  isValid={validationState.confirmPassword.isValid}
                  error={validationState.confirmPassword.error}
                />
              )}
            </View>

            {/* Submit Button */}
            <AccessibleButton
              title={mode === 'login' ? 'Sign In' : 'Create Account'}
              variant="primary"
              size="large"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
              accessibilityLabel={`${mode === 'login' ? 'Sign in' : 'Create account'} button`}
            />

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <FlexLayout direction="row" align="center" gap={16} style={styles.divider}>
                <View style={StyleSheet.flatten([styles.dividerLine, { backgroundColor: theme.border }])} />
                <AccessibleText variant="caption" style={StyleSheet.flatten([styles.dividerText, { color: theme.textTertiary }])}>
                  or continue with
                </AccessibleText>
                <View style={StyleSheet.flatten([styles.dividerLine, { backgroundColor: theme.border }])} />
              </FlexLayout>

              <FlexLayout direction="row" gap={12} justify="center" style={styles.socialButtons}>
                <SocialLoginButton
                  provider="google"
                  onPress={() => handleSocialLogin('google')}
                  disabled={loading}
                />
                <SocialLoginButton
                  provider="facebook"
                  onPress={() => handleSocialLogin('facebook')}
                  disabled={loading}
                />
                <SocialLoginButton
                  provider="twitter"
                  onPress={() => handleSocialLogin('twitter')}
                  disabled={loading}
                />
              </FlexLayout>
            </View>

            {/* Mode Toggle */}
            <FlexLayout direction="row" justify="center" align="center" gap={4} style={styles.modeToggle}>
              <AccessibleText variant="body" style={StyleSheet.flatten([styles.modeText, { color: theme.textSecondary }])}>
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </AccessibleText>
              <AccessibleButton
                title={mode === 'login' ? 'Sign Up' : 'Sign In'}
                variant="ghost"
                size="small"
                onPress={toggleMode}
                disabled={loading}
                accessibilityLabel={`Switch to ${mode === 'login' ? 'sign up' : 'sign in'} mode`}
              />
            </FlexLayout>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.footerText, { color: theme.textTertiary }])}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </AccessibleText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Elevation.lg,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  formFields: {
    marginBottom: Spacing.lg,
  },
  nameFieldsContainer: {
    marginBottom: Spacing.md,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  submitButton: {
    marginBottom: Spacing.lg,
  },
  socialContainer: {
    marginBottom: Spacing.lg,
  },
  divider: {
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: Spacing.sm,
  },
  socialButtons: {
    flexWrap: 'wrap',
  },
  modeToggle: {
    marginTop: Spacing.sm,
  },
  modeText: {
    fontSize: 15,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});