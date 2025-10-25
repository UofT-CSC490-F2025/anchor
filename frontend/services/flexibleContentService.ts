/**
 * Updated Content Service with Flexible API Support
 * Uses the new flexible API service for selective mocking
 */

import { FlexibleApiService } from './flexibleApiService';
import type { 
  UUID,
  SocialPlatform,
  ContentType,
  RiskLevel,
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

export class FlexibleContentService {
  private apiService: FlexibleApiService;

  constructor(authToken?: string) {
    this.apiService = new FlexibleApiService(authToken);
  }

  setAuthToken(authToken: string) {
    this.apiService.setAuthToken(authToken);
  }

  /**
   * 🎯 MAIN ENDPOINT: Analyze TikTok URL
   * This will use REAL API when ready, MOCK otherwise
   */
  async analyzeUrl(url: string): Promise<{
    file_name: string;
    fact_check_results: {
      version: string;
      claim: string;
      results: Array<{
        text: string;
        index: number;
        score: number;
      }>;
    };
  }> {
    return this.apiService.request('content.analyzeUrl', 'POST', { url });
  }

  /**
   * Get user's analytics data for a specific time range
   */
  async getAnalytics(timeRange = '7d'): Promise<AnalyticsData> {
    return this.apiService.request('content.getAnalytics', 'GET', { timeRange });
  }

  /**
   * Get user's flagged content with pagination and filters
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
    return this.apiService.request('content.getFlaggedContent', 'GET', {
      page,
      limit,
      ...filters
    });
  }

  /**
   * Submit user feedback for analysis run
   */
  async submitFeedback(
    analysisRunId: UUID, 
    rating: number,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<Feedback> {
    return this.apiService.request('content.submitFeedback', 'POST', {
      analysis_run_id: analysisRunId,
      rating,
      reason,
      metadata,
    });
  }

  /**
   * Get user's dashboard summary with recent activity
   */
  async getDashboardSummary(): Promise<{
    analytics: AnalyticsData;
    recentFlags: FlaggedContent[];
    pendingReviews: number;
    notifications: Notification[];
    exposureSummary?: ExposureSummary;
  }> {
    return this.apiService.request('content.getDashboardSummary', 'GET');
  }

  /**
   * Get user's exposure summaries for a time period
   */
  async getExposureSummaries(
    periodStart?: string,
    periodEnd?: string,
    limit = 10
  ): Promise<ExposureSummary[]> {
    return this.apiService.request('content.getExposureSummaries', 'GET', {
      period_start: periodStart,
      period_end: periodEnd,
      limit,
    });
  }

  /**
   * Bulk update feedback for multiple analysis runs
   */
  async bulkUpdateFeedback(
    updates: Array<{
      analysisRunId: UUID;
      rating: number;
      reason?: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<{ success: boolean; updated: number; failed: number }> {
    return this.apiService.request('content.bulkUpdateFeedback', 'POST', {
      updates: updates.map(u => ({
        analysis_run_id: u.analysisRunId,
        rating: u.rating,
        reason: u.reason,
        metadata: u.metadata,
      }))
    });
  }

  /**
   * Report content (for content that affects the user)
   */
  async reportContent(
    videoId: UUID,
    reportType: string,
    description?: string
  ): Promise<ContentReport> {
    return this.apiService.request('content.reportContent', 'POST', {
      video_id: videoId,
      report_type: reportType,
      description,
    });
  }

  /**
   * Get user's content reports
   */
  async getUserReports(
    page = 1,
    limit = 10,
    status?: string
  ): Promise<PaginatedResponse<ContentReport>> {
    return this.apiService.request('content.getUserReports', 'GET', {
      page,
      limit,
      status,
    });
  }

  /**
   * Export user's flagged content data
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
    return this.apiService.request('content.exportFlaggedContent', 'POST', {
      format,
      filters,
    });
  }

  /**
   * Trigger manual analysis for user's video
   */
  async triggerAnalysis(
    videoId: UUID,
    analysisType?: string
  ): Promise<AnalysisRun> {
    return this.apiService.request('content.triggerAnalysis', 'POST', {
      video_id: videoId,
      analysis_type: analysisType,
    });
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<PaginatedResponse<Notification>> {
    return this.apiService.request('content.getNotifications', 'GET', {
      page,
      limit,
      unread_only: unreadOnly,
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: UUID): Promise<void> {
    return this.apiService.request('content.markNotificationRead', 'PUT', {
      notification_id: notificationId,
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    return this.apiService.request('content.markAllNotificationsRead', 'PUT');
  }
}

// Factory function to create authenticated service
export function createFlexibleContentService(authToken?: string): FlexibleContentService {
  return new FlexibleContentService(authToken);
}