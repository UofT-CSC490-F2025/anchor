/**
 * Modern, professional theme inspired by iOS design system
 * with enhanced colors, gradients, and design tokens for a polished user experience.
 */

import { Platform } from 'react-native';

const primaryColorLight = '#007AFF';
const primaryColorDark = '#0A84FF';
const secondaryColorLight = '#5856D6';
const secondaryColorDark = '#5E5CE6';

export const Colors = {
  light: {
    // Text Colors
    text: '#1C1C1E',
    textSecondary: '#3A3A3C',
    textTertiary: '#8E8E93',
    
    // Background Colors
    background: '#F2F2F7',
    backgroundElevated: '#FFFFFF',
    backgroundSecondary: '#F9F9F9',
    
    // Primary & Secondary
    primary: primaryColorLight,
    primaryLight: '#E3F2FD',
    secondary: secondaryColorLight,
    secondaryLight: '#F3E5F5',
    
    // System Colors
    success: '#34C759',
    successLight: '#E8F7ED',
    warning: '#FF9500',
    warningLight: '#FFF4E6',
    error: '#FF3B30',
    errorLight: '#FFEBEE',
    info: '#5AC8FA',
    infoLight: '#E1F5FE',
    
    // UI Elements
    tint: primaryColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: primaryColorLight,
    
    // Borders & Separators
    border: '#E5E5EA',
    separator: '#C6C6C8',
    
    // Card & Surface
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    surface: '#F9F9F9',
    
    // Interactive States
    interactive: '#F2F2F7',
    interactivePressed: '#E5E5EA',
  },
  dark: {
    // Text Colors
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#8E8E93',
    
    // Background Colors
    background: '#000000',
    backgroundElevated: '#1C1C1E',
    backgroundSecondary: '#2C2C2E',
    
    // Primary & Secondary
    primary: primaryColorDark,
    primaryLight: '#1A365D',
    secondary: secondaryColorDark,
    secondaryLight: '#2D1B69',
    
    // System Colors
    success: '#32D74B',
    successLight: '#1B3B36',
    warning: '#FF9F0A',
    warningLight: '#3D2914',
    error: '#FF453A',
    errorLight: '#3B1C1C',
    info: '#64D2FF',
    infoLight: '#1B2F3A',
    
    // UI Elements
    tint: primaryColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: primaryColorDark,
    
    // Borders & Separators
    border: '#38383A',
    separator: '#545458',
    
    // Card & Surface
    card: '#1C1C1E',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    surface: '#2C2C2E',
    
    // Interactive States
    interactive: '#2C2C2E',
    interactivePressed: '#3A3A3C',
  },
};

// Design Tokens
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const Elevation = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
