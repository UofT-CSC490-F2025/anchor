/**
 * Theme Configuration
 * Color palettes and theme definitions
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Neutral colors
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  overlay: string;
  
  // Content type colors
  misinformation: string;
  hatesSpeech: string;
  spam: string;
  inappropriate: string;
  
  // Platform colors
  twitter: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

export const lightTheme: ThemeColors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#66B2FF',
  primaryDark: '#0056CC',
  
  // Secondary colors
  secondary: '#5856D6',
  secondaryLight: '#8E8DFF',
  secondaryDark: '#2E2DCC',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  
  // Neutral colors
  background: '#F2F2F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  border: '#E5E5EA',
  divider: '#C6C6C8',
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  // Content type colors
  misinformation: '#FF6384',
  hatesSpeech: '#FF9F40',
  spam: '#FFCD56',
  inappropriate: '#4BC0C0',
  
  // Platform colors
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
};

export const darkTheme: ThemeColors = {
  // Primary colors
  primary: '#0084FF',
  primaryLight: '#66B2FF',
  primaryDark: '#0066CC',
  
  // Secondary colors
  secondary: '#6F6CFF',
  secondaryLight: '#9B99FF',
  secondaryDark: '#4542CC',
  
  // Status colors
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0084FF',
  
  // Neutral colors
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  border: '#38383A',
  divider: '#48484A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Content type colors
  misinformation: '#FF6384',
  hatesSpeech: '#FF9F40',
  spam: '#FFCD56',
  inappropriate: '#4BC0C0',
  
  // Platform colors
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#FFFFFF',
};

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

export const themes = {
  light: {
    colors: lightTheme,
    isDark: false,
  } as Theme,
  dark: {
    colors: darkTheme,
    isDark: true,
  } as Theme,
};

export type ThemeType = 'light' | 'dark';

// Utility functions for theme-related operations
export const getTheme = (isDark: boolean): Theme => {
  return isDark ? themes.dark : themes.light;
};

export const getContentTypeColor = (type: string, theme: Theme): string => {
  switch (type) {
    case 'misinformation':
      return theme.colors.misinformation;
    case 'hate_speech':
      return theme.colors.hatesSpeech;
    case 'spam':
      return theme.colors.spam;
    case 'inappropriate':
      return theme.colors.inappropriate;
    default:
      return theme.colors.textTertiary;
  }
};

export const getPlatformColor = (platform: string, theme: Theme): string => {
  switch (platform) {
    case 'twitter':
      return theme.colors.twitter;
    case 'facebook':
      return theme.colors.facebook;
    case 'instagram':
      return theme.colors.instagram;
    case 'tiktok':
      return theme.colors.tiktok;
    default:
      return theme.colors.textTertiary;
  }
};