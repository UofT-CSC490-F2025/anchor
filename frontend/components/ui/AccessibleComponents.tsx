import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  TextStyle,
  ViewStyle,
  View,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useScreenSize, getResponsiveFontSize } from '../responsive/ResponsiveLayout';

interface AccessibleButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  accessibilityHint?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  accessibilityHint,
  style,
  disabled,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const { width } = useScreenSize();
  const isDark = colorScheme === 'dark';

  // Colors based on theme and variant
  const getButtonColors = () => {
    const colors = {
      primary: {
        background: isDark ? '#0066CC' : '#007AFF',
        text: '#FFFFFF',
        border: 'transparent',
      },
      secondary: {
        background: isDark ? '#333333' : '#F2F2F7',
        text: isDark ? '#FFFFFF' : '#000000',
        border: 'transparent',
      },
      outline: {
        background: 'transparent',
        text: isDark ? '#0084FF' : '#007AFF',
        border: isDark ? '#0084FF' : '#007AFF',
      },
      danger: {
        background: isDark ? '#CC0000' : '#FF3B30',
        text: '#FFFFFF',
        border: 'transparent',
      },
      ghost: {
        background: 'transparent',
        text: isDark ? '#FFFFFF' : '#007AFF',
        border: 'transparent',
      },
    };
    return colors[variant];
  };

  const buttonColors = getButtonColors();
  const fontSize = getResponsiveFontSize(size === 'small' ? 14 : size === 'large' ? 18 : 16, width);
  const paddingVertical = size === 'small' ? 8 : size === 'large' ? 16 : 12;
  const paddingHorizontal = size === 'small' ? 12 : size === 'large' ? 24 : 16;

  const buttonStyle: ViewStyle = {
    backgroundColor: disabled ? (isDark ? '#1C1C1E' : '#F2F2F7') : buttonColors.background,
    borderRadius: 8,
    paddingVertical,
    paddingHorizontal,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: disabled ? 'transparent' : buttonColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    minHeight: 44, // Minimum touch target size
    opacity: disabled ? 0.6 : 1,
    ...(style as ViewStyle),
  };

  const textStyle: TextStyle = {
    color: disabled ? (isDark ? '#8E8E93' : '#8E8E93') : buttonColors.text,
    fontSize,
    fontWeight: '600',
    textAlign: 'center',
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={buttonColors.text}
          accessibilityLabel="Loading"
        />
      );
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && iconPosition === 'left' && icon}
        <Text style={textStyle}>{title}</Text>
        {icon && iconPosition === 'right' && icon}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

interface AccessibleTextProps {
  children: React.ReactNode;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'label';
  color?: string;
  style?: TextStyle;
  accessibilityRole?: 'header' | 'text' | 'summary';
  numberOfLines?: number;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  color,
  style,
  accessibilityRole = 'text',
  numberOfLines,
}) => {
  const colorScheme = useColorScheme();
  const { width } = useScreenSize();
  const isDark = colorScheme === 'dark';

  const getTextStyle = (): TextStyle => {
    const defaultColor = isDark ? '#FFFFFF' : '#000000';
    const secondaryColor = isDark ? '#8E8E93' : '#8E8E93';

    const styles = {
      heading1: {
        fontSize: getResponsiveFontSize(28, width),
        fontWeight: '700' as const,
        color: color || defaultColor,
        lineHeight: getResponsiveFontSize(34, width),
      },
      heading2: {
        fontSize: getResponsiveFontSize(22, width),
        fontWeight: '600' as const,
        color: color || defaultColor,
        lineHeight: getResponsiveFontSize(28, width),
      },
      heading3: {
        fontSize: getResponsiveFontSize(18, width),
        fontWeight: '600' as const,
        color: color || defaultColor,
        lineHeight: getResponsiveFontSize(24, width),
      },
      body: {
        fontSize: getResponsiveFontSize(16, width),
        fontWeight: '400' as const,
        color: color || defaultColor,
        lineHeight: getResponsiveFontSize(22, width),
      },
      caption: {
        fontSize: getResponsiveFontSize(12, width),
        fontWeight: '400' as const,
        color: color || secondaryColor,
        lineHeight: getResponsiveFontSize(16, width),
      },
      label: {
        fontSize: getResponsiveFontSize(14, width),
        fontWeight: '500' as const,
        color: color || defaultColor,
        lineHeight: getResponsiveFontSize(18, width),
      },
    };

    return styles[variant];
  };

  const textStyle = {
    ...getTextStyle(),
    ...style,
  };

  return (
    <Text
      style={textStyle}
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={numberOfLines === 1}
      minimumFontScale={0.8}
    >
      {children}
    </Text>
  );
};

interface AccessibleCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  children,
  onPress,
  style,
  elevated = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const colorScheme = useColorScheme();
  const { isTablet } = useScreenSize();
  const isDark = colorScheme === 'dark';

  const cardStyle: ViewStyle = {
    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 20 : 16,
    marginVertical: 8,
    ...(elevated && {
      shadowColor: isDark ? '#FFFFFF' : '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.1 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </View>
  );
};

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
}

export const AccessibleProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color,
  backgroundColor,
  accessibilityLabel,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const progressPercentage = Math.max(0, Math.min(100, Number((progress * 100).toFixed(2))));

  const containerStyle: ViewStyle = {
    height,
    backgroundColor: backgroundColor || (isDark ? '#2C2C2E' : '#E5E5EA'),
    borderRadius: height / 2,
    overflow: 'hidden',
  };

  const progressStyle: ViewStyle = {
    height: '100%',
    width: `${progressPercentage}%`,
    backgroundColor: color || (isDark ? '#0084FF' : '#007AFF'),
    borderRadius: height / 2,
  };

  return (
    <View
      style={containerStyle}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel || `Progress: ${Math.round(progressPercentage)}%`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(progressPercentage),
      }}
    >
      <View style={progressStyle} />
    </View>
  );
};