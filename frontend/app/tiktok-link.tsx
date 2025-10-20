/**
 * TikTok Link Page
 * Full-screen page for managing TikTok account linking
 */

import React from 'react';
import { Stack } from 'expo-router';

import { TikTokOnboardingScreen } from '@/components/tiktok/TikTokOnboardingScreen';

export default function TikTokLinkPage() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Link TikTok Account',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <TikTokOnboardingScreen />
    </>
  );
}