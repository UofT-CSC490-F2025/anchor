/**
 * App Configuration
 * Central configuration for the application
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CONFIG = {
  // App Information
  APP_NAME: 'Content Moderator',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',

  // API Configuration
  API: {
    BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://api.contentmoderator.com',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // Screen Dimensions
  SCREEN: {
    WIDTH: SCREEN_WIDTH,
    HEIGHT: SCREEN_HEIGHT,
    IS_SMALL: SCREEN_WIDTH < 380,
    IS_TABLET: SCREEN_WIDTH >= 768,
  },

  // Breakpoints for responsive design
  BREAKPOINTS: {
    SMALL: 380,
    MEDIUM: 768,
    LARGE: 1024,
  },

  // Animation Configuration
  ANIMATION: {
    DURATION: {
      SHORT: 200,
      MEDIUM: 300,
      LONG: 500,
    },
    EASING: {
      EASE_IN: 'ease-in',
      EASE_OUT: 'ease-out',
      EASE_IN_OUT: 'ease-in-out',
    },
  },

  // Storage Keys
  STORAGE_KEYS: {
    USER_SETTINGS: 'user_settings',
    AUTH_TOKEN: 'auth_token',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    THEME_PREFERENCE: 'theme_preference',
    ACCESSIBILITY_SETTINGS: 'accessibility_settings',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },

  // Content Moderation
  CONTENT: {
    MAX_CONTENT_LENGTH: 5000,
    CONFIDENCE_THRESHOLD: 0.7,
    FLAGGED_CONTENT_TYPES: [
      'misinformation',
      'hate_speech',
      'spam',
      'inappropriate',
    ] as const,
    SOCIAL_PLATFORMS: [
      'twitter',
      'facebook',
      'instagram',
      'tiktok',
    ] as const,
  },

  // UI Configuration
  UI: {
    HEADER_HEIGHT: 60,
    TAB_BAR_HEIGHT: 80,
    BORDER_RADIUS: {
      SMALL: 4,
      MEDIUM: 8,
      LARGE: 12,
      EXTRA_LARGE: 16,
    },
    SPACING: {
      XS: 4,
      SM: 8,
      MD: 16,
      LG: 24,
      XL: 32,
      XXL: 48,
    },
    FONT_SIZES: {
      XS: 10,
      SM: 12,
      MD: 14,
      LG: 16,
      XL: 18,
      XXL: 22,
      XXXL: 28,
    },
    SHADOWS: {
      SMALL: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      MEDIUM: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
      LARGE: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  },

  // Performance
  PERFORMANCE: {
    IMAGE_CACHE_SIZE: 100,
    LIST_OPTIMIZATION_THRESHOLD: 50,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 500,
  },

  // Feature Flags
  FEATURES: {
    ENABLE_ANALYTICS: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_DARK_MODE: true,
    ENABLE_ACCESSIBILITY: true,
    ENABLE_OFFLINE_MODE: false,
    ENABLE_BIOMETRIC_AUTH: false,
  },

  // Development
  DEV: {
    ENABLE_FLIPPER: __DEV__,
    ENABLE_LOGS: __DEV__,
    ENABLE_REDUX_DEVTOOLS: __DEV__,
    MOCK_API: __DEV__, // Enable selective mocking for endpoints that don't exist
  },
} as const;

export type AppConfig = typeof CONFIG;
export type ContentType = typeof CONFIG.CONTENT.FLAGGED_CONTENT_TYPES[number];
export type SocialPlatform = typeof CONFIG.CONTENT.SOCIAL_PLATFORMS[number];