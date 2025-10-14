/**
 * API Response Types
 * Centralized type definitions for all API interactions
 */

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
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
}

// Content Analysis Types
export interface AnalyticsData {
  totalPosts: number;
  flaggedContent: number;
  accuracy: number;
  timeRange: string;
  engagementData: EngagementDataPoint[];
}

export interface EngagementDataPoint {
  date: string;
  engagement: number;
  flagged: number;
}

export interface FlaggedContent {
  id: string;
  type: ContentType;
  content: string;
  platform: SocialPlatform;
  confidenceScore: number;
  timestamp: string;
  userFeedback?: UserFeedback | null;
  reasons: string[];
  metadata?: Record<string, any>;
}

export type ContentType = 'misinformation' | 'hate_speech' | 'spam' | 'inappropriate';
export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'tiktok';
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