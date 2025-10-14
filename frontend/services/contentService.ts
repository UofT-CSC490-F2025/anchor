/**
 * Content Service
 * API service for content moderation functionality
 */

import { BaseApiService } from './baseApi';
import type { 
  FlaggedContent, 
  AnalyticsData, 
  PaginatedResponse
} from '@/types/api';

export class ContentService extends BaseApiService {
  /**
   * Get analytics data for a specific time range
   */
  async getAnalytics(timeRange = '7d'): Promise<AnalyticsData> {
    const response = await this.get<AnalyticsData>(`/analytics?timeRange=${timeRange}`);
    return response.data;
  }

  /**
   * Get paginated flagged content
   */
  async getFlaggedContent(
    page = 1, 
    limit = 10,
    filters?: {
      type?: string;
      platform?: string;
      confidenceThreshold?: number;
    }
  ): Promise<PaginatedResponse<FlaggedContent>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.platform && { platform: filters.platform }),
      ...(filters?.confidenceThreshold && { 
        confidenceThreshold: filters.confidenceThreshold.toString() 
      }),
    });

    const response = await this.get<FlaggedContent[]>(`/flagged-content?${params}`);
    return response as PaginatedResponse<FlaggedContent>;
  }

  /**
   * Submit user feedback for flagged content
   */
  async submitFeedback(
    contentId: string, 
    feedback: 'correct' | 'incorrect',
    notes?: string
  ): Promise<boolean> {
    const response = await this.post<{ success: boolean }>('/feedback', {
      contentId,
      feedback,
      notes,
    });
    return response.data.success;
  }

  /**
   * Get dashboard summary with recent activity
   */
  async getDashboardSummary(): Promise<{
    analytics: AnalyticsData;
    recentFlags: FlaggedContent[];
    pendingReviews: number;
  }> {
    const response = await this.get<{
      analytics: AnalyticsData;
      recentFlags: FlaggedContent[];
      pendingReviews: number;
    }>('/dashboard/summary');
    return response.data;
  }

  /**
   * Get flagged content by ID
   */
  async getFlaggedContentById(id: string): Promise<FlaggedContent> {
    const response = await this.get<FlaggedContent>(`/flagged-content/${id}`);
    return response.data;
  }

  /**
   * Bulk update feedback for multiple content items
   */
  async bulkUpdateFeedback(
    updates: Array<{
      contentId: string;
      feedback: 'correct' | 'incorrect';
      notes?: string;
    }>
  ): Promise<{ success: boolean; updated: number; failed: number }> {
    const response = await this.post<{
      success: boolean;
      updated: number;
      failed: number;
    }>('/feedback/bulk', { updates });
    return response.data;
  }

  /**
   * Export flagged content data
   */
  async exportFlaggedContent(
    format: 'csv' | 'json' = 'csv',
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      type?: string;
      platform?: string;
    }
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const response = await this.post<{
      downloadUrl: string;
      expiresAt: string;
    }>('/export/flagged-content', { format, filters });
    return response.data;
  }
}

// Export singleton instance
export const contentService = new ContentService();