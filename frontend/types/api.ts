/**
 * API Response Types
 * Centralized type definitions for all API interactions
 */

import type { 
  UUID, 
  SocialPlatform, 
  ContentType, 
  VideoWithAnalysis, 
  DashboardMetrics, 
  ContentAnalytics, 
  UserProfile
} from './database';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
  user_id: UUID; // All responses should include user context
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  user_id?: UUID;
}

// Authentication Types
export interface AuthRequest {
  email?: string;
  password?: string;
  oauth_token?: string;
  provider?: 'google' | 'facebook' | 'twitter';
}

export interface AuthResponse extends ApiResponse<{
  user: UserProfile;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// User Management Types
export interface UpdateUserProfileRequest {
  display_name?: string;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface UserAccountConnectionRequest {
  platform: SocialPlatform;
  oauth_token: string;
  scopes: string[];
}

// Content Analysis Types - Updated to match schema
export interface AnalyticsData {
  user_id: UUID;
  metrics: DashboardMetrics;
  analytics: ContentAnalytics;
}

export interface EngagementDataPoint {
  date: string;
  videos_analyzed: number;
  flagged_count: number;
  platforms: Record<SocialPlatform, number>;
  risk_levels: Record<string, number>;
}

// Updated to match Video entity in database
// FlaggedContent is now defined as VideoWithAnalysis below

export type UserFeedback = 'correct' | 'incorrect';

// User Settings Types
export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  preferences: UserPreferences;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  flaggedContentAlerts: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  anonymousAnalytics: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}

export interface UserPreferences {
  defaultTimeRange: TimeRange;
  autoRefresh: boolean;
  detailedAnalytics: boolean;
}

export type TimeRange = '24h' | '7d' | '30d';

// Chart Data Types
export interface ChartDataset {
  data: number[];
  color?: (opacity?: number) => string;
  strokeWidth?: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface PieChartDataPoint {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Authentication Response Types
export interface AuthResponse extends ApiResponse<{
  user: UserProfile;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {}

// User Management Request Types
export interface UpdateUserProfileRequest {
  display_name?: string;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface UserAccountConnectionRequest {
  platform: SocialPlatform;
  oauth_token: string;
  oauth_token_secret?: string;
  account_scopes?: string[];
}

// Import types from database schema
export type { 
  UserProfile,
  SocialPlatform,
  ContentType,
  RiskLevel,
  VideoWithAnalysis,
  DashboardMetrics,
  ContentAnalytics
} from './database';

// Use VideoWithAnalysis as FlaggedContent with additional computed properties
export type FlaggedContent = VideoWithAnalysis & {
  // Legacy compatibility properties
  userFeedback?: UserFeedback;
  reasons?: string[];
  
  // Computed properties for UI
  primaryContentType?: ContentType;
  highestConfidenceLabel?: string;
};