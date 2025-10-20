import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccessibilityProvider } from '@/hooks/useAccessibility';
import { AuthProvider } from '@/contexts/AuthContext';
import { TikTokProvider } from '@/contexts/TikTokContext';
import { NavigationGuard } from '@/components/auth/NavigationGuard';
import { initializeMockApi } from '@/services/mockApiInterceptor';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize mock API interceptor on app start
  useEffect(() => {
    initializeMockApi();
  }, []);

  return (
    <AuthProvider>
      <TikTokProvider>
        <AccessibilityProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <NavigationGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                // Accessibility improvements for navigation
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            >
              <Stack.Screen 
                name="auth" 
                options={{ 
                  headerShown: false,
                  title: 'Authentication'
                }} 
              />
              <Stack.Screen 
                name="(tabs)" 
                options={{ 
                  headerShown: false
                }} 
              />
              <Stack.Screen 
                name="modal" 
                options={{ 
                  presentation: 'modal', 
                  title: 'Modal'
                }} 
              />
              <Stack.Screen 
                name="tiktok-link" 
                options={{ 
                  presentation: 'modal', 
                  title: 'Link TikTok Account'
                }} 
              />
            </Stack>
              <StatusBar style="auto" />
            </NavigationGuard>
          </ThemeProvider>
        </AccessibilityProvider>
      </TikTokProvider>
    </AuthProvider>
  );
}
