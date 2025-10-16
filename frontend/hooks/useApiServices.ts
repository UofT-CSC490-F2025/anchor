/**
 * API Services Hook
 * Provides authenticated API services with user context
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createContentService } from '@/services/contentService';
import { createUserService } from '@/services/userService';

export function useApiServices() {
  const { accessToken, isAuthenticated } = useAuth();

  const services = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return {
        contentService: null,
        userService: null,
        isReady: false,
      };
    }

    return {
      contentService: createContentService(accessToken),
      userService: createUserService(accessToken),
      isReady: true,
    };
  }, [isAuthenticated, accessToken || null]);

  return services;
}

export function useContentService() {
  const { contentService, isReady } = useApiServices();
  
  // Return null instead of throwing to allow conditional usage
  if (!isReady || !contentService) {
    return null;
  }
  
  return contentService;
}

export function useUserService() {
  const { userService, isReady } = useApiServices();
  
  // Return null instead of throwing to allow conditional usage
  if (!isReady || !userService) {
    return null;
  }
  
  return userService;
}