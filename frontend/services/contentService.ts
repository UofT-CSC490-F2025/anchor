/**
 * Content Service
 * API service for user-scoped content moderation functionality
 */

import { BaseApiService } from './baseApi';
import type { 
  UUID,
  SocialPlatform,
  ContentType,
  RiskLevel,
  VideoWithAnalysis,
  AnalysisRun,
  Feedback,
  ExposureSummary,
  ContentReport,
  Notification
} from '@/types/database';
import type { 
  FlaggedContent, 
  AnalyticsData, 
  PaginatedResponse
} from '@/types/api';

export class ContentService extends BaseApiService {
  constructor(authToken?: string) {
    super();
    if (authToken) {
      this.setAuthToken(authToken);
    }
  }

  // User-scoped endpoints - all require authentication

  /**
   * Get user's analytics data for a specific time range
   * All data scoped to the authenticated user
   */
  async getAnalytics(timeRange = '7d'): Promise<AnalyticsData> {
    const response = await this.get<AnalyticsData>(`/users/analytics?timeRange=${timeRange}`);
    return response.data;
  }

  /**
   * Get user's flagged content with pagination and filters
   * Only returns videos belonging to the authenticated user
   */
  async getFlaggedContent(
    page = 1, 
    limit = 10,
    filters?: {
      platform?: SocialPlatform;
      contentType?: ContentType;
      riskLevel?: RiskLevel;
      confidenceThreshold?: number;
      dateFrom?: string;
      dateTo?: string;
      hasUserFeedback?: boolean;
    }
  ): Promise<PaginatedResponse<FlaggedContent>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.platform && { platform: filters.platform }),
      ...(filters?.contentType && { content_type: filters.contentType }),
      ...(filters?.riskLevel && { risk_level: filters.riskLevel }),
      ...(filters?.confidenceThreshold && { 
        confidence_threshold: filters.confidenceThreshold.toString() 
      }),
      ...(filters?.dateFrom && { date_from: filters.dateFrom }),
      ...(filters?.dateTo && { date_to: filters.dateTo }),
      ...(filters?.hasUserFeedback !== undefined && { 
        has_user_feedback: filters.hasUserFeedback.toString() 
      }),
    });

    const response = await this.get<FlaggedContent[]>(`/users/videos/flagged?${params}`);
    return response as PaginatedResponse<FlaggedContent>;
  }

  /**
   * Get a specific video with analysis details
   * Only if the video belongs to the authenticated user
   */
  async getVideoById(videoId: UUID): Promise<VideoWithAnalysis> {
    const response = await this.get<VideoWithAnalysis>(`/users/videos/${videoId}`);
    return response.data;
  }

  /**
   * Submit user feedback for analysis run
   * User can only provide feedback for their own content
   */
  async submitFeedback(
    analysisRunId: UUID, 
    rating: number,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<Feedback> {
    const response = await this.post<Feedback>('/users/feedback', {
      analysis_run_id: analysisRunId,
      rating,
      reason,
      metadata,
    });
    return response.data;
  }

  /**
   * Get user's dashboard summary with recent activity
   * All data scoped to the authenticated user
   */
  async getDashboardSummary(): Promise<{
    analytics: AnalyticsData;
    recentFlags: FlaggedContent[];
    pendingReviews: number;
    notifications: Notification[];
    exposureSummary?: ExposureSummary;
  }> {
    const response = await this.get<{
      analytics: AnalyticsData;
      recentFlags: FlaggedContent[];
      pendingReviews: number;
      notifications: Notification[];
      exposureSummary?: ExposureSummary;
    }>('/users/dashboard/summary');
    return response.data;
  }

  /**
   * Get user's exposure summaries for a time period
   */
  async getExposureSummaries(
    periodStart?: string,
    periodEnd?: string,
    limit = 10
  ): Promise<ExposureSummary[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(periodStart && { period_start: periodStart }),
      ...(periodEnd && { period_end: periodEnd }),
    });

    const response = await this.get<ExposureSummary[]>(`/users/exposure-summaries?${params}`);
    return response.data;
  }

  /**
   * Bulk update feedback for multiple analysis runs
   * User can only provide feedback for their own content
   */
  async bulkUpdateFeedback(
    updates: Array<{
      analysisRunId: UUID;
      rating: number;
      reason?: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<{ success: boolean; updated: number; failed: number }> {
    const response = await this.post<{
      success: boolean;
      updated: number;
      failed: number;
    }>('/users/feedback/bulk', { 
      updates: updates.map(u => ({
        analysis_run_id: u.analysisRunId,
        rating: u.rating,
        reason: u.reason,
        metadata: u.metadata,
      }))
    });
    return response.data;
  }

  /**
   * Report content (for content that affects the user)
   */
  async reportContent(
    videoId: UUID,
    reportType: string,
    description?: string
  ): Promise<ContentReport> {
    const response = await this.post<ContentReport>('/users/reports', {
      video_id: videoId,
      report_type: reportType,
      description,
    });
    return response.data;
  }

  /**
   * Get user's content reports
   */
  async getUserReports(
    page = 1,
    limit = 10,
    status?: string
  ): Promise<PaginatedResponse<ContentReport>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await this.get<ContentReport[]>(`/users/reports?${params}`);
    return response as PaginatedResponse<ContentReport>;
  }

  /**
   * Export user's flagged content data
   * Only exports data belonging to the authenticated user
   */
  async exportFlaggedContent(
    format: 'csv' | 'json' = 'csv',
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      platform?: SocialPlatform;
      contentType?: ContentType;
      riskLevel?: RiskLevel;
    }
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const response = await this.post<{
      downloadUrl: string;
      expiresAt: string;
    }>('/users/export/flagged-content', { format, filters });
    return response.data;
  }

  /**
   * Trigger manual analysis for user's video
   */
  async triggerAnalysis(
    videoId: UUID,
    analysisType?: string
  ): Promise<AnalysisRun> {
    const response = await this.post<AnalysisRun>(`/users/videos/${videoId}/analyze`, {
      analysis_type: analysisType,
    });
    return response.data;
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unread_only: 'true' }),
    });

    const response = await this.get<Notification[]>(`/users/notifications?${params}`);
    return response as PaginatedResponse<Notification>;
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: UUID): Promise<void> {
    await this.put(`/users/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    await this.put('/users/notifications/read-all');
  }
}

// Factory function to create authenticated service
export function createContentService(authToken: string): ContentService {
  return new ContentService(authToken);
}

// Export singleton instance (will be replaced with factory in components)
export const contentService = new ContentService();