/**
 * Development Utilities
 * Helper functions for developers to understand API routing
 */

import { apiConfig, shouldUseMock } from '@/config/apiConfig';

/**
 * Get current API configuration status
 */
export function getApiStatus() {
  const status: Record<string, { useMock: boolean; url?: string }> = {};
  
  Object.entries(apiConfig.endpoints).forEach(([category, endpoints]) => {
    Object.keys(endpoints).forEach(endpoint => {
      const key = `${category}.${endpoint}`;
      const useMock = shouldUseMock(key);
      
      status[key] = {
        useMock,
        url: useMock ? 'MOCK' : `${apiConfig.global.baseUrl}/...`
      };
    });
  });
  
  return status;
}

/**
 * Print API status to console (for debugging)
 */
export function logApiStatus() {
  const status = getApiStatus();
  
  console.group('🔧 API Endpoint Status');
  console.log('Global Mock Mode:', apiConfig.global.enableMockMode);
  console.log('Base URL:', apiConfig.global.baseUrl);
  console.log('');
  
  Object.entries(status).forEach(([endpoint, config]) => {
    const icon = config.useMock ? '🎭' : '🚀';
    const type = config.useMock ? 'MOCK' : 'REAL';
    console.log(`${icon} ${endpoint}: ${type}`);
  });
  
  console.groupEnd();
}

/**
 * Quick function to enable/disable all mocks (for development)
 */
export function toggleAllMocks(enable: boolean) {
  console.warn(
    `⚠️ toggleAllMocks(${enable}) called. ` +
    'This overrides configuration and is for development only!'
  );
  
  // This would require modifying the config - for now just log
  console.log(`Would ${enable ? 'enable' : 'disable'} all mocks`);
}

/**
 * React component to display API status in development
 * Note: This is for web development only
 */
export function createApiStatusIndicator() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return function ApiStatusIndicator() {
    const status = getApiStatus();
    const mockCount = Object.values(status).filter(s => s.useMock).length;
    const realCount = Object.values(status).filter(s => !s.useMock).length;
    
    return `API: ${realCount} real, ${mockCount} mock`;
  };
}

// Expose global function for easy console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logApiStatus = logApiStatus;
  (window as any).getApiStatus = getApiStatus;
}