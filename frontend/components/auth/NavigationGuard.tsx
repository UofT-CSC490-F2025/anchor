/**
 * Navigation Guard Component
 * Manages authentication-based routing and redirects
 */

import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { TikTokOnboardingScreen } from '@/components/tiktok/TikTokOnboardingScreen';

interface NavigationGuardProps {
  children: React.ReactNode;
}

export const NavigationGuard: React.FC<NavigationGuardProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { shouldShowTikTokOnboarding, completeTikTokOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  const isLoading = authLoading || onboardingLoading;

  useEffect(() => {
    if (isLoading) return; // Don't navigate while still loading

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // User is not authenticated and not on auth screen, redirect to auth
      router.replace('/auth');
    } else if (user && inAuthGroup && !shouldShowTikTokOnboarding) {
      // User is authenticated and on auth screen, and doesn't need onboarding
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, shouldShowTikTokOnboarding]);

  // Show TikTok onboarding if needed
  if (user && shouldShowTikTokOnboarding && !isLoading) {
    console.log('🎵 Showing TikTok onboarding for new user:', user.display_name);
    return (
      <TikTokOnboardingScreen
        onSkip={completeTikTokOnboarding}
        onComplete={completeTikTokOnboarding}
      />
    );
  }

  return <>{children}</>;
};