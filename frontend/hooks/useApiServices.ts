/**
 * API Services Hook with Flexible Mocking
 * Provides authenticated API services with selective mock/real endpoint control
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createContentService } from '@/services/contentService';
import { createUserService } from '@/services/userService';
import { createFlexibleContentService } from '@/services/flexibleContentService';

export function useApiServices() {
  const { accessToken, isAuthenticated } = useAuth();

  const services = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return {
        contentService: null,
        userService: null,
        flexibleContentService: null,
        isReady: false,
      };
    }

    return {
      contentService: createContentService(accessToken),
      userService: createUserService(accessToken),
      flexibleContentService: createFlexibleContentService(accessToken), // New flexible service
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

export function useFlexibleContentService() {
  const { flexibleContentService, isReady } = useApiServices();
  
  // Return null instead of throwing to allow conditional usage
  if (!isReady || !flexibleContentService) {
    return null;
  }
  
  return flexibleContentService;
}

export function useUserService() {
  const { userService, isReady } = useApiServices();
  
  // Return null instead of throwing to allow conditional usage
  if (!isReady || !userService) {
    return null;
  }
  
  return userService;
}