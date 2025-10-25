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
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
    timeout: 30000, // 30 seconds for analysis endpoints
    enableMockMode: process.env.EXPO_PUBLIC_ENABLE_MOCKS !== 'false', // Default to mocked in dev
  },
  
  endpoints: {
    auth: {
      login: { useMock: true },
      logout: { useMock: true },
      refreshToken: { useMock: true },
      register: { useMock: true },
    },
    
    content: {
      analyzeUrl: { 
        useMock: true,   // 🎯 Set to false when backend endpoint is ready
        timeout: 60000   // Longer timeout for analysis
      },
      getFlaggedContent: { useMock: true },
      submitFeedback: { useMock: true },
      getDashboardSummary: { useMock: true },
      getAnalytics: { useMock: true },
    },
    
    user: {
      getProfile: { useMock: true },
      updateProfile: { useMock: true },
      getSettings: { useMock: true },
      updateSettings: { useMock: true },
    },
    
    tiktok: {
      initiateAuth: { useMock: true },
      completeAuth: { useMock: true },
      getUserFeed: { useMock: true },
      refreshFeed: { useMock: true },
      disconnect: { useMock: true },
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