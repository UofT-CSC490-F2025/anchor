/**
 * User Service
 * API service for user management and account operations
 */

import { BaseApiService } from './baseApi';
import type { 
  UUID,
  UserProfile,
  UserAccount,
  Device,
  PrivacyConsent,
  UserTrustScore,
  RealTimeAlert
} from '@/types/database';
import type { 
  UpdateUserProfileRequest,
  UserAccountConnectionRequest,
  PaginatedResponse
} from '@/types/api';

export class UserService extends BaseApiService {
  constructor(authToken?: string) {
    super();
    if (authToken) {
      this.setAuthToken(authToken);
    }
  }

  /**
   * Get current user profile with related data
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.get<UserProfile>('/users/profile');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateUserProfileRequest): Promise<UserProfile> {
    const response = await this.put<UserProfile>('/users/profile', updates);
    return response.data;
  }

  /**
   * Get user's connected social media accounts
   */
  async getUserAccounts(): Promise<UserAccount[]> {
    const response = await this.get<UserAccount[]>('/users/accounts');
    return response.data;
  }

  /**
   * Connect a new social media account
   */
  async connectAccount(accountData: UserAccountConnectionRequest): Promise<UserAccount> {
    const response = await this.post<UserAccount>('/users/accounts', accountData);
    return response.data;
  }

  /**
   * Disconnect a social media account
   */
  async disconnectAccount(accountId: UUID): Promise<void> {
    await this.delete(`/users/accounts/${accountId}`);
  }

  /**
   * Refresh OAuth token for an account
   */
  async refreshAccountToken(accountId: UUID): Promise<UserAccount> {
    const response = await this.post<UserAccount>(`/users/accounts/${accountId}/refresh`);
    return response.data;
  }

  /**
   * Get user's registered devices
   */
  async getDevices(): Promise<Device[]> {
    const response = await this.get<Device[]>('/users/devices');
    return response.data;
  }

  /**
   * Register a new device for push notifications
   */
  async registerDevice(deviceData: {
    device_type: string;
    push_token?: string;
  }): Promise<Device> {
    const response = await this.post<Device>('/users/devices', deviceData);
    return response.data;
  }

  /**
   * Update device information
   */
  async updateDevice(deviceId: UUID, updates: {
    push_token?: string;
    device_type?: string;
  }): Promise<Device> {
    const response = await this.put<Device>(`/users/devices/${deviceId}`, updates);
    return response.data;
  }

  /**
   * Unregister a device
   */
  async unregisterDevice(deviceId: UUID): Promise<void> {
    await this.delete(`/users/devices/${deviceId}`);
  }

  /**
   * Get user's privacy consents
   */
  async getPrivacyConsents(): Promise<PrivacyConsent[]> {
    const response = await this.get<PrivacyConsent[]>('/users/privacy-consents');
    return response.data;
  }

  /**
   * Grant privacy consent
   */
  async grantConsent(consentData: {
    consent_type: string;
    consent_value: Record<string, any>;
    ip_address: string;
    user_agent: string;
  }): Promise<PrivacyConsent> {
    const response = await this.post<PrivacyConsent>('/users/privacy-consents', consentData);
    return response.data;
  }

  /**
   * Revoke privacy consent
   */
  async revokeConsent(
    consentId: UUID,
    ipAddress: string,
    userAgent: string
  ): Promise<PrivacyConsent> {
    const response = await this.put<PrivacyConsent>(`/users/privacy-consents/${consentId}/revoke`, {
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    return response.data;
  }

  /**
   * Get user's trust score
   */
  async getTrustScore(): Promise<UserTrustScore> {
    const response = await this.get<UserTrustScore>('/users/trust-score');
    return response.data;
  }

  /**
   * Get user's real-time alerts configuration
   */
  async getRealTimeAlerts(): Promise<RealTimeAlert[]> {
    const response = await this.get<RealTimeAlert[]>('/users/alerts');
    return response.data;
  }

  /**
   * Create a new real-time alert
   */
  async createAlert(alertData: {
    alert_type: string;
    threshold_config: Record<string, any>;
  }): Promise<RealTimeAlert> {
    const response = await this.post<RealTimeAlert>('/users/alerts', alertData);
    return response.data;
  }

  /**
   * Update a real-time alert
   */
  async updateAlert(alertId: UUID, updates: {
    threshold_config?: Record<string, any>;
    is_active?: boolean;
  }): Promise<RealTimeAlert> {
    const response = await this.put<RealTimeAlert>(`/users/alerts/${alertId}`, updates);
    return response.data;
  }

  /**
   * Delete a real-time alert
   */
  async deleteAlert(alertId: UUID): Promise<void> {
    await this.delete(`/users/alerts/${alertId}`);
  }

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(): Promise<void> {
    await this.delete('/users/profile');
  }

  /**
   * Request data export (GDPR compliance)
   */
  async requestDataExport(format: 'json' | 'csv' = 'json'): Promise<{
    exportId: UUID;
    estimatedCompletionTime: string;
  }> {
    const response = await this.post<{
      exportId: UUID;
      estimatedCompletionTime: string;
    }>('/users/data-export', { format });
    return response.data;
  }

  /**
   * Get data export status
   */
  async getDataExportStatus(exportId: UUID): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    const response = await this.get<{
      status: 'pending' | 'processing' | 'completed' | 'failed';
      downloadUrl?: string;
      expiresAt?: string;
      error?: string;
    }>(`/users/data-export/${exportId}`);
    return response.data;
  }

  /**
   * Get user activity logs (for transparency)
   */
  async getActivityLogs(
    page = 1,
    limit = 50,
    actionType?: string
  ): Promise<PaginatedResponse<{
    id: UUID;
    action: string;
    target_type?: string;
    target_id?: UUID;
    details?: Record<string, any>;
    created_at: string;
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(actionType && { action_type: actionType }),
    });

    const response = await this.get<any[]>(`/users/activity-logs?${params}`);
    return response as PaginatedResponse<any>;
  }
}

// Factory function to create authenticated service
export function createUserService(authToken: string): UserService {
  return new UserService(authToken);
}

// Export singleton instance (will be replaced with factory in components)
export const userService = new UserService();