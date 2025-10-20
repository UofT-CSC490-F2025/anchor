/**
 * Onboarding Hook
 * Manages user onboarding state and flow
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTikTok } from '@/contexts/TikTokContext';

interface OnboardingState {
  hasCompletedTikTokOnboarding: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const { user, isNewSignup, clearNewSignup } = useAuth();
  const { isLinked: isTikTokLinked } = useTikTok();
  
  const [state, setState] = useState<OnboardingState>({
    hasCompletedTikTokOnboarding: false,
    isLoading: true,
  });

  const TIKTOK_ONBOARDING_KEY = 'tiktok_onboarding_completed';

  useEffect(() => {
    if (user) {
      loadOnboardingState();
    } else {
      setState({
        hasCompletedTikTokOnboarding: false,
        isLoading: false,
      });
    }
  }, [user]);

  const loadOnboardingState = async () => {
    try {
      const completed = await AsyncStorage.getItem(`${TIKTOK_ONBOARDING_KEY}_${user?.id}`);
      setState({
        hasCompletedTikTokOnboarding: completed === 'true' || isTikTokLinked,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
      setState({
        hasCompletedTikTokOnboarding: false,
        isLoading: false,
      });
    }
  };

  const completeTikTokOnboarding = async () => {
    if (!user?.id) return;
    
    try {
      await AsyncStorage.setItem(`${TIKTOK_ONBOARDING_KEY}_${user.id}`, 'true');
      setState(prev => ({
        ...prev,
        hasCompletedTikTokOnboarding: true,
      }));
      // Clear the new signup flag since onboarding is complete
      clearNewSignup();
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
    }
  };

  const shouldShowTikTokOnboarding = (): boolean => {
    const shouldShow = user !== null && 
           !state.isLoading && 
           !state.hasCompletedTikTokOnboarding && 
           !isTikTokLinked &&
           isNewSignup; // Only show for new signups, not returning users
    
    console.log('🔍 TikTok onboarding check:', {
      hasUser: user !== null,
      isLoading: state.isLoading,
      hasCompleted: state.hasCompletedTikTokOnboarding,
      isTikTokLinked,
      isNewSignup,
      shouldShow
    });
    
    return shouldShow;
  };

  return {
    ...state,
    completeTikTokOnboarding,
    shouldShowTikTokOnboarding: shouldShowTikTokOnboarding(),
  };
}