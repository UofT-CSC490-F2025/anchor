/**
 * TikTok Onboarding Screen
 * Encourages users to link their TikTok account after signup/login
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTikTok } from '@/contexts/TikTokContext';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton } from '@/components/ui/AccessibleComponents';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

interface TikTokOnboardingScreenProps {
  onSkip?: () => void;
  onComplete?: () => void;
}

export function TikTokOnboardingScreen({ onSkip, onComplete }: TikTokOnboardingScreenProps) {
  const [linking, setLinking] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const { initiateLinking, completeLinking, error, clearError } = useTikTok();

  const handleLinkTikTok = async () => {
    try {
      setLinking(true);
      clearError();
      
      const authUrl = await initiateLinking();
      
      // Open TikTok auth in browser
      const canOpen = await Linking.canOpenURL(authUrl);
      if (canOpen) {
        await Linking.openURL(authUrl);
        
        // Simulate successful linking for demo purposes
        // In a real app, this would be handled via deep link callback
        setTimeout(async () => {
          try {
            await completeLinking('mock_auth_code_success');
            Alert.alert(
              'Success!',
              'Your TikTok account has been linked successfully. You can now get personalized content analysis.',
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    onComplete?.();
                    router.replace('/(tabs)');
                  },
                },
              ]
            );
          } catch (err) {
            console.error('TikTok linking failed:', err);
          } finally {
            setLinking(false);
          }
        }, 3000); // Simulate auth flow delay
      } else {
        throw new Error('Cannot open TikTok authorization URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link TikTok account';
      Alert.alert('Error', errorMessage);
      setLinking(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    router.replace('/(tabs)');
  };

  return (
    <ResponsiveContainer style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with TikTok branding */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#ff0050', '#000000']}
            style={styles.tiktokLogo}
          >
            <AccessibleText style={styles.tiktokIcon}>🎵</AccessibleText>
          </LinearGradient>
          
          <AccessibleText 
            variant="heading1" 
            style={StyleSheet.flatten([styles.title, { color: theme.text }])}
            accessibilityRole="header"
          >
            Connect Your TikTok
          </AccessibleText>
          
          <AccessibleText 
            variant="body" 
            style={StyleSheet.flatten([styles.subtitle, { color: theme.textSecondary }])}
          >
            Link your TikTok account to get personalized insights about your content consumption
          </AccessibleText>
        </View>

        {/* Benefits Section */}
        <View style={StyleSheet.flatten([styles.benefitsContainer, { backgroundColor: theme.card, ...Elevation.md }])}>
          <AccessibleText 
            variant="heading2" 
            style={StyleSheet.flatten([styles.benefitsTitle, { color: theme.text }])}
          >
            Why link your TikTok?
          </AccessibleText>
          
          <View style={styles.benefitsList}>
            <BenefitItem 
              icon="📊"
              title="Content Analysis"
              description="Get detailed insights about the content you watch and engage with"
              theme={theme}
            />
            <BenefitItem 
              icon="🎯"
              title="Trend Detection"
              description="Discover trending topics and hashtags in your feed"
              theme={theme}
            />
            <BenefitItem 
              icon="📈"
              title="Usage Patterns"
              description="Understand your viewing habits and screen time patterns"
              theme={theme}
            />
            <BenefitItem 
              icon="🔒"
              title="Privacy First"
              description="Your data is processed securely and never shared with third parties"
              theme={theme}
            />
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={StyleSheet.flatten([styles.errorContainer, { backgroundColor: `${theme.error}15` }])}>
            <AccessibleText style={StyleSheet.flatten([styles.errorText, { color: theme.error }])}>
              {error}
            </AccessibleText>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <AccessibleButton
            title={linking ? "Linking Account..." : "Link TikTok Account"}
            variant="primary"
            size="large"
            onPress={handleLinkTikTok}
            loading={linking}
            style={styles.linkButton}
            accessibilityLabel="Link your TikTok account to get content insights"
          />
          
          <AccessibleButton
            title="Skip for Now"
            variant="ghost"
            size="medium"
            onPress={handleSkip}
            disabled={linking}
            style={styles.skipButton}
            accessibilityLabel="Skip TikTok linking and continue to the main app"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AccessibleText variant="caption" style={StyleSheet.flatten([styles.footerText, { color: theme.textTertiary }])}>
            You can link or unlink your TikTok account anytime from the settings page
          </AccessibleText>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

interface BenefitItemProps {
  icon: string;
  title: string;
  description: string;
  theme: any;
}

function BenefitItem({ icon, title, description, theme }: BenefitItemProps) {
  return (
    <FlexLayout direction="row" gap={12} align="flex-start" style={styles.benefitItem}>
      <View style={StyleSheet.flatten([styles.benefitIcon, { backgroundColor: `${theme.primary}15` }])}>
        <AccessibleText style={styles.benefitIconText}>{icon}</AccessibleText>
      </View>
      <View style={styles.benefitContent}>
        <AccessibleText 
          variant="body" 
          style={StyleSheet.flatten([styles.benefitTitle, { color: theme.text }])}
        >
          {title}
        </AccessibleText>
        <AccessibleText 
          variant="caption" 
          style={StyleSheet.flatten([styles.benefitDescription, { color: theme.textSecondary }])}
        >
          {description}
        </AccessibleText>
      </View>
    </FlexLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  tiktokLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Elevation.lg,
  },
  tiktokIcon: {
    fontSize: 32,
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  benefitsList: {
    gap: Spacing.lg,
  },
  benefitItem: {
    paddingVertical: Spacing.xs,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitIconText: {
    fontSize: 18,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  linkButton: {
    // Additional styles if needed
  },
  skipButton: {
    // Additional styles if needed
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});