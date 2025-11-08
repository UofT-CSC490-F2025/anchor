/**
 * API Configuration
 * Controls which endpoints use real backend vs mocked data
 */

export interface ApiEndpointConfig {
  useMock: boolean;
  baseUrl?: string;
  timeout?: number;
}

export interface ApiConfig {
  // Global settings
  global: {
    baseUrl: string;
    timeout: number;
    enableMockMode: boolean; // Master switch for all mocking
  };
  
  // Individual endpoint configurations
  endpoints: {
    // Authentication endpoints
    auth: {
      login: ApiEndpointConfig;
      logout: ApiEndpointConfig;
      refreshToken: ApiEndpointConfig;
      register: ApiEndpointConfig;
    };
    
    // Content analysis endpoints
    content: {
      analyzeUrl: ApiEndpointConfig;           // /predict endpoint
      getFlaggedContent: ApiEndpointConfig;    // Get user's analyzed content
      submitFeedback: ApiEndpointConfig;       // Submit user feedback
      getDashboardSummary: ApiEndpointConfig;  // Dashboard data
      getAnalytics: ApiEndpointConfig;         // Analytics data
    };
    
    // User management endpoints
    user: {
      getProfile: ApiEndpointConfig;
      updateProfile: ApiEndpointConfig;
      getSettings: ApiEndpointConfig;
      updateSettings: ApiEndpointConfig;
    };
    
    // TikTok integration endpoints
    tiktok: {
      initiateAuth: ApiEndpointConfig;
      completeAuth: ApiEndpointConfig;
      getUserFeed: ApiEndpointConfig;
      refreshFeed: ApiEndpointConfig;
      disconnect: ApiEndpointConfig;
    };
  };
}

// Development configuration - easy to toggle individual endpoints
export const apiConfig: ApiConfig = {
  global: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000, // 30 seconds for analysis endpoints
    enableMockMode: true, // Enable selective mocking since some endpoints don't exist yet
  },
  
  endpoints: {
    auth: {
      login: { useMock: false },        // ✅ Real endpoint exists
      logout: { useMock: false },       // ✅ Real endpoint exists
      refreshToken: { useMock: false }, // ✅ Real endpoint exists
      register: { useMock: false },     // ✅ Real endpoint exists
    },
    
    content: {
      analyzeUrl: { 
        useMock: false,   // ✅ Real endpoint exists (/api/tiktok/predict)
        timeout: 120000   // 2 minutes for video analysis
      },
      getFlaggedContent: { useMock: true },    // ❌ Endpoint doesn't exist yet
      submitFeedback: { useMock: true },       // ❌ Endpoint doesn't exist yet
      getDashboardSummary: { useMock: true },  // ❌ Endpoint doesn't exist yet
      getAnalytics: { useMock: true },         // ❌ Endpoint doesn't exist yet
    },
    
    user: {
      getProfile: { useMock: true },     // ❌ Endpoint doesn't exist yet
      updateProfile: { useMock: true },  // ❌ Endpoint doesn't exist yet
      getSettings: { useMock: true },    // ❌ Endpoint doesn't exist yet
      updateSettings: { useMock: true }, // ❌ Endpoint doesn't exist yet
    },
    
    tiktok: {
      initiateAuth: { useMock: true },   // ❌ Endpoint doesn't exist yet
      completeAuth: { useMock: true },   // ❌ Endpoint doesn't exist yet
      getUserFeed: { useMock: true },    // ❌ Endpoint doesn't exist yet
      refreshFeed: { useMock: true },    // ❌ Endpoint doesn't exist yet
      disconnect: { useMock: true },     // ❌ Endpoint doesn't exist yet
    },
  },
};

// Helper function to check if an endpoint should use mock
export function shouldUseMock(endpointPath: string): boolean {
  // If global mock mode is disabled, never use mocks
  if (!apiConfig.global.enableMockMode) {
    return false;
  }
  
  // Parse the endpoint path (e.g., "content.analyzeUrl")
  const [category, endpoint] = endpointPath.split('.');
  
  if (category && endpoint) {
    const categoryConfig = apiConfig.endpoints[category as keyof typeof apiConfig.endpoints];
    if (categoryConfig && endpoint in categoryConfig) {
      const endpointConfig = (categoryConfig as any)[endpoint];
      return endpointConfig?.useMock ?? true;
    }
  }
  
  // Default to mock if not configured
  return true;
}

// Get configuration for a specific endpoint
export function getEndpointConfig(endpointPath: string): ApiEndpointConfig {
  const [category, endpoint] = endpointPath.split('.');
  
  if (category && endpoint) {
    const categoryConfig = apiConfig.endpoints[category as keyof typeof apiConfig.endpoints];
    if (categoryConfig && endpoint in categoryConfig) {
      return (categoryConfig as any)[endpoint];
    }
  }
  
  // Default configuration
  return {
    useMock: true,
    baseUrl: apiConfig.global.baseUrl,
    timeout: apiConfig.global.timeout,
  };
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";