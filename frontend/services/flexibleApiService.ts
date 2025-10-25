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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || 30000);
    requestConfig.signal = controller.signal;

    try {
      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Build real API URL based on endpoint
   */
  private buildRealApiUrl(category: string, endpoint: string): string {
    const endpointMap: Record<string, Record<string, string>> = {
      content: {
        analyzeUrl: '/predict',
        getFlaggedContent: '/users/videos/flagged',
        submitFeedback: '/users/feedback',
        getDashboardSummary: '/users/dashboard/summary',
        getAnalytics: '/users/analytics',
      },
      auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refreshToken: '/auth/refresh',
        register: '/auth/register',
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
        // Create multiple realistic mock claims for testing
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

        // Sometimes return just one claim for variety
        const selectedClaims = Math.random() > 0.5 ? mockClaims : [mockClaims[0]];

        const mockResponse = {
          file_name: `tiktok_${Date.now()}.mp4`,
          fact_check_results: {
            version: "2",
            claim: data?.url ? "Mock analysis of TikTok content for development testing" : "No content analyzed",
            results: selectedClaims
          }
        };
        console.log('🎭 Mock analyzeUrl response:', mockResponse);
        return mockResponse as T;

      case 'getFlaggedContent':
        return {
          data: [], // Mock empty for now
          pagination: { page: 1, limit: 10, total: 0, hasNext: false, hasPrev: false }
        } as T;

      default:
        throw new Error(`Mock not implemented for content.${endpoint}`);
    }
  }

  private async handleMockAuth<T>(endpoint: string, _method: string, _data?: any): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Implement mock auth responses
    throw new Error(`Mock not implemented for auth.${endpoint}`);
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