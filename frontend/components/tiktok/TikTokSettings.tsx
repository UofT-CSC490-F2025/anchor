/**
 * TikTok Settings Component
 * Manages TikTok account linking, unlinking, and preferences
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTikTok } from '@/contexts/TikTokContext';

import { FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton } from '@/components/ui/AccessibleComponents';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

export function TikTokSettings() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const { 
    isLinked, 
    profile, 
    unlinkAccount, 
    isLoading,
    error,
    clearError 
  } = useTikTok();

  // Mock settings state
  const [settings, setSettings] = useState({
    autoAnalyze: true,
    notifyTrends: true,
    shareInsights: false,
    trackWatchTime: true,
  });

  const handleLinkAccount = () => {
    router.push('/tiktok-link');
  };

  const handleUnlinkAccount = () => {
    Alert.alert(
      'Unlink TikTok Account',
      'Are you sure you want to unlink your TikTok account? This will remove access to your feed analysis and insights.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkAccount();
              Alert.alert('Success', 'Your TikTok account has been unlinked.');
            } catch (err) {
              Alert.alert('Error', 'Failed to unlink TikTok account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSyncNow = async () => {
    Alert.alert(
      'Sync TikTok Data',
      'This will refresh your feed data and update your analysis. This may take a few moments.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sync Now',
          onPress: () => {
            // In a real app, this would trigger a sync
            Alert.alert('Success', 'Your TikTok data has been synced.');
          },
        },
      ]
    );
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (error) {
    setTimeout(() => clearError(), 3000);
  }

  return (
    <View style={styles.container}>
      {/* Account Status Section */}
      <View style={StyleSheet.flatten([styles.section, { backgroundColor: theme.card, ...Elevation.sm }])}>
        <AccessibleText 
          variant="heading3" 
          style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}
        >
          TikTok Account
        </AccessibleText>
        
        {isLinked && profile ? (
          <View style={styles.accountInfo}>
            <FlexLayout direction="row" gap={12} align="center">
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={styles.accountAvatar}
              />
              <View style={styles.accountDetails}>
                <AccessibleText 
                  variant="body" 
                  style={StyleSheet.flatten([styles.accountName, { color: theme.text }])}
                >
                  {profile.display_name}
                </AccessibleText>
                <AccessibleText 
                  variant="caption" 
                  style={StyleSheet.flatten([styles.accountUsername, { color: theme.textSecondary }])}
                >
                  @{profile.username}
                </AccessibleText>
                {profile.verified && (
                  <View style={styles.verifiedBadge}>
                    <AccessibleText style={styles.verifiedText}>✓ Verified</AccessibleText>
                  </View>
                )}
              </View>
            </FlexLayout>

            <View style={styles.accountActions}>
              <AccessibleButton
                title="Sync Now"
                variant="secondary"
                size="small"
                onPress={handleSyncNow}
                disabled={isLoading}
                style={styles.syncButton}
              />
              <AccessibleButton
                title="Unlink"
                variant="ghost"
                size="small"
                onPress={handleUnlinkAccount}
                disabled={isLoading}
                style={StyleSheet.flatten([styles.unlinkButton, { borderColor: theme.error }])}
              />
            </View>

            {/* Account Stats */}
            <FlexLayout direction="row" gap={16} style={styles.accountStats}>
              <View style={styles.statItem}>
                <AccessibleText 
                  variant="body" 
                  style={StyleSheet.flatten([styles.statNumber, { color: theme.text }])}
                >
                  {profile.follower_count.toLocaleString()}
                </AccessibleText>
                <AccessibleText 
                  variant="caption" 
                  style={StyleSheet.flatten([styles.statLabel, { color: theme.textSecondary }])}
                >
                  Followers
                </AccessibleText>
              </View>
              <View style={styles.statItem}>
                <AccessibleText 
                  variant="body" 
                  style={StyleSheet.flatten([styles.statNumber, { color: theme.text }])}
                >
                  {profile.following_count.toLocaleString()}
                </AccessibleText>
                <AccessibleText 
                  variant="caption" 
                  style={StyleSheet.flatten([styles.statLabel, { color: theme.textSecondary }])}
                >
                  Following
                </AccessibleText>
              </View>
              <View style={styles.statItem}>
                <AccessibleText 
                  variant="body" 
                  style={StyleSheet.flatten([styles.statNumber, { color: theme.text }])}
                >
                  {profile.video_count.toLocaleString()}
                </AccessibleText>
                <AccessibleText 
                  variant="caption" 
                  style={StyleSheet.flatten([styles.statLabel, { color: theme.textSecondary }])}
                >
                  Videos
                </AccessibleText>
              </View>
            </FlexLayout>
          </View>
        ) : (
          <View style={styles.noAccount}>
            <AccessibleText 
              variant="body" 
              style={StyleSheet.flatten([styles.noAccountText, { color: theme.textSecondary }])}
            >
              No TikTok account linked. Connect your account to get personalized insights.
            </AccessibleText>
            <AccessibleButton
              title="Link TikTok Account"
              variant="primary"
              size="medium"
              onPress={handleLinkAccount}
              disabled={isLoading}
              style={styles.linkButton}
            />
          </View>
        )}

        {error && (
          <View style={StyleSheet.flatten([styles.errorContainer, { backgroundColor: `${theme.error}15` }])}>
            <AccessibleText style={StyleSheet.flatten([styles.errorText, { color: theme.error }])}>
              {error}
            </AccessibleText>
          </View>
        )}
      </View>

      {/* Analysis Settings */}
      {isLinked && (
        <View style={StyleSheet.flatten([styles.section, { backgroundColor: theme.card, ...Elevation.sm }])}>
          <AccessibleText 
            variant="heading3" 
            style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}
          >
            Analysis Settings
          </AccessibleText>

          <View style={styles.settingsList}>
            <SettingItem
              title="Auto-Analyze Feed"
              description="Automatically analyze new content in your TikTok feed"
              value={settings.autoAnalyze}
              onValueChange={(value) => updateSetting('autoAnalyze', value)}
              theme={theme}
            />
            
            <SettingItem
              title="Trend Notifications"
              description="Get notified when you engage with trending content"
              value={settings.notifyTrends}
              onValueChange={(value) => updateSetting('notifyTrends', value)}
              theme={theme}
            />
            
            <SettingItem
              title="Track Watch Time"
              description="Monitor and analyze your TikTok viewing patterns"
              value={settings.trackWatchTime}
              onValueChange={(value) => updateSetting('trackWatchTime', value)}
              theme={theme}
            />
            
            <SettingItem
              title="Share Insights"
              description="Allow anonymous insights to improve our analysis"
              value={settings.shareInsights}
              onValueChange={(value) => updateSetting('shareInsights', value)}
              theme={theme}
            />
          </View>
        </View>
      )}

      {/* Privacy Information */}
      <View style={StyleSheet.flatten([styles.section, { backgroundColor: theme.card, ...Elevation.sm }])}>
        <AccessibleText 
          variant="heading3" 
          style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}
        >
          Privacy & Security
        </AccessibleText>
        
        <AccessibleText 
          variant="body" 
          style={StyleSheet.flatten([styles.privacyText, { color: theme.textSecondary }])}
        >
          Your TikTok data is processed securely and used only for generating personalized insights. 
          We never share your personal information or content with third parties.
        </AccessibleText>
        
        <AccessibleButton
          title="View Privacy Policy"
          variant="ghost"
          size="small"
          onPress={() => Alert.alert('Privacy Policy', 'This would open the full privacy policy.')}
          style={styles.privacyButton}
        />
      </View>
    </View>
  );
}

interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: any;
}

function SettingItem({ title, description, value, onValueChange, theme }: SettingItemProps) {
  return (
    <FlexLayout direction="row" justify="space-between" align="flex-start" style={styles.settingItem}>
      <View style={styles.settingContent}>
        <AccessibleText 
          variant="body" 
          style={StyleSheet.flatten([styles.settingTitle, { color: theme.text }])}
        >
          {title}
        </AccessibleText>
        <AccessibleText 
          variant="caption" 
          style={StyleSheet.flatten([styles.settingDescription, { color: theme.textSecondary }])}
        >
          {description}
        </AccessibleText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: `${theme.primary}40` }}
        thumbColor={value ? theme.primary : theme.textTertiary}
      />
    </FlexLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  accountInfo: {
    gap: Spacing.lg,
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  verifiedBadge: {
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#1DA1F2',
    fontWeight: '500',
  },
  accountActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  syncButton: {
    flex: 1,
  },
  unlinkButton: {
    flex: 1,
    borderWidth: 1,
  },
  accountStats: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  noAccount: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  noAccountText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkButton: {
    minWidth: 200,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  settingsList: {
    gap: Spacing.lg,
  },
  settingItem: {
    minHeight: 60,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  privacyButton: {
    alignSelf: 'flex-start',
  },
});