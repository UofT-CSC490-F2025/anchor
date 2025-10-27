/**
 * Flexible API Service with Selective Mocking
 * Allows switching between real and mocked endpoints per feature
 */

import { apiConfig, shouldUseMock, getEndpointConfig } from '@/config/apiConfig';

export class FlexibleApiService {
  private baseUrl: string;
  private authToken: string | undefined;

  constructor(authToken?: string) {
    this.baseUrl = apiConfig.global.baseUrl;
    this.authToken = authToken;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Generic request handler that routes to mock or real API
   */
  async request<T>(
    endpointPath: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const config = getEndpointConfig(endpointPath);
    const useMock = shouldUseMock(endpointPath);

    if (useMock) {
      return this.mockRequest<T>(endpointPath, method, data);
    } else {
      return this.realRequest<T>(endpointPath, method, data, config);
    }
  }

  /**
   * Mock request handler - routes to appropriate mock service
   */
  private async mockRequest<T>(
    endpointPath: string,
    method: string,
    data?: any
  ): Promise<T> {
    const [category, endpoint] = endpointPath.split('.');
    
    if (!category || !endpoint) {
      throw new Error(`Invalid endpoint path: ${endpointPath}`);
    }
    
    console.log(`🎭 Using MOCK for ${endpointPath}`);
    
    switch (category) {
      case 'content':
        return this.handleMockContent<T>(endpoint, method, data);
      case 'auth':
        return this.handleMockAuth<T>(endpoint, method, data);
      case 'user':
        return this.handleMockUser<T>(endpoint, method, data);
      case 'tiktok':
        return this.handleMockTikTok<T>(endpoint, method, data);
      default:
        throw new Error(`Mock not implemented for ${endpointPath}`);
    }
  }

  /**
   * Real API request handler
   */
  private async realRequest<T>(
    endpointPath: string,
    method: string,
    data?: any,
    config?: any
  ): Promise<T> {
    const [category, endpoint] = endpointPath.split('.');
    
    if (!category || !endpoint) {
      throw new Error(`Invalid endpoint path: ${endpointPath}`);
    }
    
    const url = this.buildRealApiUrl(category, endpoint);
    
    console.log(`🚀 Using REAL API for ${endpointPath} -> ${url}`);

    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    let requestConfig: RequestInit = {
      method,
      headers,
    };

    // Handle different content types based on endpoint
    if (endpointPath === 'content.analyzeUrl' && data?.url) {
      // For TikTok predict endpoint, send as JSON (backend expects JSON)
      headers['Content-Type'] = 'application/json';
      requestConfig.body = JSON.stringify(data);
    } else if (data) {
      // For other endpoints, send as JSON
      headers['Content-Type'] = 'application/json';
      requestConfig.body = JSON.stringify(data);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || 30000);
    requestConfig.signal = controller.signal;

    try {
      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          // Handle FastAPI validation error format
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // FastAPI validation errors
              errorMessage = errorData.detail.map((err: any) => 
                `${err.loc?.join('.')||'field'}: ${err.msg}`
              ).join(', ');
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If JSON parsing fails, use generic error message
          errorMessage = `Request failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - the server took too long to respond');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          throw new Error('Network error - please check your internet connection and try again');
        }
      }
      // Re-throw the error with its original message
      throw error;
    }
  }

  /**
   * Build real API URL based on endpoint
   */
  private buildRealApiUrl(category: string, endpoint: string): string {
    const endpointMap: Record<string, Record<string, string>> = {
      content: {
        analyzeUrl: '/api/tiktok/predict',
        getFlaggedContent: '/users/videos/flagged',
        submitFeedback: '/users/feedback',
        getDashboardSummary: '/users/dashboard/summary',
        getAnalytics: '/users/analytics',
      },
      auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refreshToken: '/auth/refresh',
        register: '/auth/signup',
        oauth: '/auth/oauth',
        validate: '/auth/validate',
      },
      user: {
        getProfile: '/users/profile',
        updateProfile: '/users/profile',
        getSettings: '/users/settings',
        updateSettings: '/users/settings',
      },
      tiktok: {
        initiateAuth: '/tiktok/auth/initiate',
        completeAuth: '/tiktok/auth/complete',
        getUserFeed: '/tiktok/feed',
        refreshFeed: '/tiktok/feed/refresh',
        disconnect: '/tiktok/disconnect',
      },
    };

    const path = endpointMap[category]?.[endpoint];
    if (!path) {
      throw new Error(`Unknown endpoint: ${category}.${endpoint}`);
    }

    return `${this.baseUrl}${path}`;
  }

  /**
   * Mock handlers for different categories
   */
  private async handleMockContent<T>(endpoint: string, _method: string, data?: any): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    switch (endpoint) {
      case 'analyzeUrl':
        // Create multiple realistic mock claims matching ClaimBuster API format
        const mockClaims = [
          {
            text: data?.url ? "This TikTok video contains verifiable information about climate change" : "No content analyzed",
            index: 0,
            score: 0.75 // High factuality
          },
          {
            text: data?.url ? "The claims made in this video can be fact-checked against scientific sources" : "No content analyzed", 
            index: 1,
            score: 0.65 // High factuality
          }
        ];

        // Sometimes return just one claim for variety, sometimes return empty for no claims
        const claimVariations = [
          mockClaims, 
          [mockClaims[0]], 
          mockClaims.slice(0, 1),
          [] // No claims found
        ];
        const selectedClaims = claimVariations[Math.floor(Math.random() * claimVariations.length)];

        const mockResponse = {
          file_name: `tiktok_${Date.now()}.mp4`,
          deepfake_check: {
            status: "not_implemented",
            message: "Deepfake detection not yet implemented"
          },
          fact_check_results: {
            status: "completed",
            claims: selectedClaims,
            message: (selectedClaims && selectedClaims.length > 0)
              ? "Fact-checking completed successfully" 
              : "No specific factual claims detected in this content"
          }
        };
        console.log('🎭 Mock analyzeUrl response:', mockResponse);
        return mockResponse as T;

      case 'getFlaggedContent':
        return {
          data: [], // Mock empty for now
          pagination: { page: 1, limit: 10, total: 0, hasNext: false, hasPrev: false }
        } as T;

      case 'submitFeedback':
        return {
          success: true,
          data: { id: 'mock-feedback-id', created_at: new Date().toISOString() },
          message: 'Feedback submitted successfully'
        } as T;

      case 'getAnalytics':
        return {
          user_id: 'mock-user-id',
          metrics: {
            total_videos: 0,
            flagged_videos: 0,
            high_risk_videos: 0,
            pending_reviews: 0,
            accuracy_rate: 0,
            trust_score: 0,
            time_range: '7d'
          }
        } as T;

      case 'getDashboardSummary':
        return {
          analytics: {
            user_id: 'mock-user-id',
            metrics: {
              total_videos: 0,
              flagged_videos: 0,
              high_risk_videos: 0,
              pending_reviews: 0,
              accuracy_rate: 0,
              trust_score: 0,
              time_range: '7d'
            }
          },
          recentFlags: [],
          pendingReviews: 0,
          notifications: []
        } as T;

      default:
        throw new Error(`Mock not implemented for content.${endpoint}`);
    }
  }

  private async handleMockAuth<T>(endpoint: string, _method: string, data?: any): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (endpoint) {
      case 'login':
        return {
          success: true,
          user: {
            id: 'mock-user-id',
            email: data?.email || 'test@example.com',
            display_name: 'Mock User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            locale: 'en',
            metadata: {}
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          tokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isNewUser: false
        } as T;
      
      case 'register':
        return {
          success: true,
          user: {
            id: 'mock-new-user-id',
            email: data?.email || 'newuser@example.com',
            display_name: `${data?.firstName || 'New'} ${data?.lastName || 'User'}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            locale: 'en',
            metadata: {}
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          tokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isNewUser: true
        } as T;
      
      case 'refreshToken':
        return {
          success: true,
          token: 'mock-new-jwt-token',
          refreshToken: 'mock-new-refresh-token',
          tokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        } as T;
      
      case 'logout':
        return {
          success: true,
          message: 'Logged out successfully'
        } as T;
      
      case 'oauth':
        return {
          success: true,
          user: {
            id: 'mock-oauth-user-id',
            email: `${data?.provider || 'oauth'}user@example.com`,
            display_name: `${data?.provider?.charAt(0).toUpperCase() + data?.provider?.slice(1) || 'OAuth'} User`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            locale: 'en',
            metadata: {}
          },
          token: 'mock-oauth-jwt-token',
          refreshToken: 'mock-oauth-refresh-token',
          tokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          isNewUser: Math.random() > 0.5 // Randomly decide if it's a new user
        } as T;
      
      case 'validate':
        return {
          success: true,
          user: {
            id: 'mock-validated-user-id',
            email: 'validated@example.com',
            display_name: 'Validated User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            locale: 'en',
            metadata: {}
          },
          valid: true
        } as T;
      
      default:
        throw new Error(`Mock not implemented for auth.${endpoint}`);
    }
  }

  private async handleMockUser<T>(endpoint: string, _method: string, _data?: any): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Implement mock user responses
    throw new Error(`Mock not implemented for user.${endpoint}`);
  }

  private async handleMockTikTok<T>(endpoint: string, _method: string, _data?: any): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Implement mock TikTok responses
    throw new Error(`Mock not implemented for tiktok.${endpoint}`);
  }
}

// Factory function for creating service instances
export function createFlexibleApiService(authToken?: string): FlexibleApiService {
  return new FlexibleApiService(authToken);
}