/**
 * Authentication UI Components
 * Reusable components for authentication screens
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { AccessibleText } from '@/components/ui/AccessibleComponents';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

// Auth Input Component
interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  isValid?: boolean;
  helperText?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  required = false,
  isValid,
  helperText,
  secureTextEntry,
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleToggleSecure = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <AccessibleText variant="label" style={StyleSheet.flatten([styles.label, { color: theme.text }])}>
          {label}
          {required && <AccessibleText style={StyleSheet.flatten([styles.required, { color: theme.error }])}> *</AccessibleText>}
        </AccessibleText>
      </View>
      
      <View style={[
        styles.inputWrapper,
        { 
          backgroundColor: theme.backgroundElevated,
          borderColor: error 
            ? theme.error 
            : isValid 
              ? '#10B981' // Green for valid
              : (isFocused ? theme.primary : theme.border),
        }
      ]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          placeholderTextColor={theme.textTertiary}
          selectionColor={theme.primary}
          autoCorrect={false}
          spellCheck={false}
          {...props}
        />
        
        {/* Validation Icon */}
        {!secureTextEntry && value && !isFocused && (
          <View style={styles.validationIcon}>
            <AccessibleText style={StyleSheet.flatten([
              styles.validationIconText,
              { color: error ? theme.error : isValid ? '#10B981' : theme.textTertiary }
            ])}>
              {error ? '⚠️' : isValid ? '✅' : ''}
            </AccessibleText>
          </View>
        )}
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handleToggleSecure}
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
          >
            <AccessibleText style={StyleSheet.flatten([styles.toggleText, { color: theme.textSecondary }])}>
              {isSecure ? '👁️' : '🙈'}
            </AccessibleText>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Error or Helper Text */}
      {error ? (
        <AccessibleText variant="caption" style={StyleSheet.flatten([styles.errorText, { color: theme.error }])}>
          {error}
        </AccessibleText>
      ) : helperText ? (
        <AccessibleText variant="caption" style={StyleSheet.flatten([styles.helperTextStyle, { color: theme.textTertiary }])}>
          {helperText}
        </AccessibleText>
      ) : null}
    </View>
  );
};

// Enhanced Error Alert Component
interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  style?: any;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  style,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  if (!error) return null;

  return (
    <View style={StyleSheet.flatten([
      styles.errorAlert,
      { 
        backgroundColor: `${theme.error}10`,
        borderColor: `${theme.error}30`,
      },
      style
    ])}>
      <View style={styles.errorContent}>
        <AccessibleText style={StyleSheet.flatten([styles.errorIcon, { color: theme.error }])}>
          ⚠️
        </AccessibleText>
        <View style={styles.errorTextContainer}>
          <AccessibleText 
            variant="body" 
            style={StyleSheet.flatten([styles.errorMessage, { color: theme.error }])}
          >
            {error}
          </AccessibleText>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss error"
            accessibilityRole="button"
          >
            <AccessibleText style={StyleSheet.flatten([styles.dismissText, { color: theme.error }])}>
              ✕
            </AccessibleText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Social Login Button Component
interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'twitter';
  onPress: () => void;
  disabled?: boolean;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          icon: '🌐',
          label: 'Google',
          backgroundColor: '#4285F4',
          textColor: '#FFFFFF',
        };
      case 'facebook':
        return {
          icon: '📘',
          label: 'Facebook',
          backgroundColor: '#1877F2',
          textColor: '#FFFFFF',
        };
      case 'twitter':
        return {
          icon: '🐦',
          label: 'Twitter',
          backgroundColor: '#1DA1F2',
          textColor: '#FFFFFF',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      style={[
        styles.socialButton,
        {
          backgroundColor: disabled ? theme.interactive : config.backgroundColor,
          opacity: disabled ? 0.6 : 1,
        }
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`Sign in with ${config.label}`}
      accessibilityRole="button"
    >
      <AccessibleText style={styles.socialIcon}>{config.icon}</AccessibleText>
      <AccessibleText 
        style={StyleSheet.flatten([
          styles.socialText, 
          { color: disabled ? theme.textSecondary : config.textColor }
        ])}
      >
        {config.label}
      </AccessibleText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Auth Input Styles
  inputContainer: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  required: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  toggleButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  toggleText: {
    fontSize: 16,
  },
  validationIcon: {
    marginLeft: Spacing.xs,
  },
  validationIconText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  helperTextStyle: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },

  // Error Alert Styles
  errorAlert: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  dismissButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Social Login Button Styles
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    minHeight: 44,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
  },
});