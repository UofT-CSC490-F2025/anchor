import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton, AccessibleCard } from '@/components/ui/AccessibleComponents';
import { TikTokSettings } from '@/components/tiktok/TikTokSettings';
import { mockApiService, UserSettings } from '@/services/mockApi';
import { mockAuthAPI } from '@/services/mockAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await mockApiService.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (path: string[], value: boolean | string) => {
    if (!settings) return;

    const newSettings = { ...settings };
    let current: any = newSettings;
    
    // Navigate to the correct nested object
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current && key && current[key]) {
        current = current[key];
      }
    }
    const finalKey = path[path.length - 1];
    if (current && finalKey) {
      current[finalKey] = value;
    }

    setSettings(newSettings);

    try {
      setSaving(true);
      await mockApiService.updateUserSettings(newSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      // Revert the change
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const renderToggleSetting = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    accessibilityHint?: string,
    icon?: string
  ) => (
    <AccessibleCard style={StyleSheet.flatten([styles.settingCard, { backgroundColor: theme.card }, Elevation.sm])}>
      <FlexLayout direction="row" justify="space-between" align="center">
        <View style={styles.settingContent}>
          <View style={styles.settingHeader}>
            {icon && (
              <View style={[styles.settingIcon, { backgroundColor: `${theme.primary}15` }]}>
                <AccessibleText style={StyleSheet.flatten([styles.settingIconText, { color: theme.primary }])}>
                  {icon}
                </AccessibleText>
              </View>
            )}
            <View style={styles.settingTextContainer}>
              <AccessibleText variant="body" style={StyleSheet.flatten([styles.settingTitle, { color: theme.text }])}>
                {title}
              </AccessibleText>
              <AccessibleText variant="caption" style={StyleSheet.flatten([styles.settingDescription, { color: theme.textSecondary }])}>
                {description}
              </AccessibleText>
            </View>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          accessibilityLabel={title}
          accessibilityHint={accessibilityHint}
          accessibilityRole="switch"
          trackColor={{ 
            false: theme.interactive, 
            true: theme.success 
          }}
          thumbColor={theme.backgroundElevated}
          disabled={saving}
        />
      </FlexLayout>
    </AccessibleCard>
  );

  const renderOptionSetting = (
    title: string,
    description: string,
    currentValue: string,
    options: Array<{ value: string; label: string }>,
    onSelect: (value: string) => void
  ) => (
    <AccessibleCard style={StyleSheet.flatten([styles.settingCard, { backgroundColor: theme.card }, Elevation.sm])}>
      <View style={styles.settingContent}>
        <View style={styles.settingHeader}>
          <View style={[styles.settingIcon, { backgroundColor: `${theme.secondary}15` }]}>
            <AccessibleText style={StyleSheet.flatten([styles.settingIconText, { color: theme.secondary }])}>
              ⏱️
            </AccessibleText>
          </View>
          <View style={styles.settingTextContainer}>
            <AccessibleText variant="body" style={StyleSheet.flatten([styles.settingTitle, { color: theme.text }])}>
              {title}
            </AccessibleText>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.settingDescription, { color: theme.textSecondary }])}>
              {description}
            </AccessibleText>
          </View>
        </View>
        <FlexLayout direction="row" gap={Spacing.sm} style={styles.optionButtons}>
          {options.map((option) => (
            <AccessibleButton
              key={option.value}
              title={option.label}
              variant={currentValue === option.value ? 'primary' : 'outline'}
              size="small"
              onPress={() => onSelect(option.value)}
              accessibilityState={{ selected: currentValue === option.value }}
              disabled={saving}
            />
          ))}
        </FlexLayout>
      </View>
    </AccessibleCard>
  );

  const renderActionSetting = (
    title: string,
    description: string,
    buttonTitle: string,
    onPress: () => void,
    variant: 'primary' | 'secondary' | 'danger' = 'secondary'
  ) => (
    <AccessibleCard style={styles.settingCard}>
      <FlexLayout direction="row" justify="space-between" align="center">
        <View style={styles.settingContent}>
          <AccessibleText variant="body" style={styles.settingTitle}>
            {title}
          </AccessibleText>
          <AccessibleText variant="caption" style={styles.settingDescription}>
            {description}
          </AccessibleText>
        </View>
        <AccessibleButton
          title={buttonTitle}
          variant={variant}
          size="small"
          onPress={onPress}
          disabled={saving}
        />
      </FlexLayout>
    </AccessibleCard>
  );

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared for download. You will receive an email when it\'s ready.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been scheduled for deletion.');
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            try {
              setSaving(true);
              // Reset to default settings
              const defaultSettings: UserSettings = {
                notifications: {
                  pushEnabled: true,
                  emailEnabled: false,
                  flaggedContentAlerts: true,
                },
                privacy: {
                  dataSharing: false,
                  anonymousAnalytics: true,
                },
                accessibility: {
                  highContrast: false,
                  largeText: false,
                  screenReader: false,
                },
                preferences: {
                  defaultTimeRange: '7d',
                  autoRefresh: true,
                  detailedAnalytics: true,
                },
              };
              await mockApiService.updateUserSettings(defaultSettings);
              setSettings(defaultSettings);
              Alert.alert('Success', 'Settings have been reset to default values.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ResponsiveContainer style={styles.loadingContainer}>
        <AccessibleText variant="body">Loading settings...</AccessibleText>
      </ResponsiveContainer>
    );
  }

  if (!settings) {
    return (
      <ResponsiveContainer style={styles.errorContainer}>
        <AccessibleText variant="body">Failed to load settings</AccessibleText>
        <AccessibleButton title="Retry" onPress={loadSettings} />
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AccessibleText variant="heading1" style={StyleSheet.flatten([styles.title, { color: theme.text }])} accessibilityRole="header">
            Settings
          </AccessibleText>
          <AccessibleText variant="body" style={StyleSheet.flatten([styles.subtitle, { color: theme.textSecondary }])}>
            Customize your app experience
          </AccessibleText>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            🔔 Notifications
          </AccessibleText>
          
          {renderToggleSetting(
            'Push Notifications',
            'Receive notifications on your device',
            settings.notifications.pushEnabled,
            () => updateSetting(['notifications', 'pushEnabled'], !settings.notifications.pushEnabled),
            'Toggle push notifications on or off',
            '📱'
          )}

          {renderToggleSetting(
            'Email Notifications',
            'Receive email updates about your content',
            settings.notifications.emailEnabled,
            () => updateSetting(['notifications', 'emailEnabled'], !settings.notifications.emailEnabled),
            'Toggle email notifications on or off',
            '📧'
          )}

          {renderToggleSetting(
            'Flagged Content Alerts',
            'Get notified when new content is flagged',
            settings.notifications.flaggedContentAlerts,
            () => updateSetting(['notifications', 'flaggedContentAlerts'], !settings.notifications.flaggedContentAlerts),
            'Toggle flagged content alerts on or off',
            '🚩'
          )}
        </View>

        {/* TikTok Integration Section */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            🎵 TikTok Integration
          </AccessibleText>
          
          <TikTokSettings />
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            🔒 Privacy
          </AccessibleText>
          
          {renderToggleSetting(
            'Data Sharing',
            'Share anonymized data to improve AI accuracy',
            settings.privacy.dataSharing,
            () => updateSetting(['privacy', 'dataSharing'], !settings.privacy.dataSharing),
            'Toggle data sharing for AI improvement',
            '🤝'
          )}

          {renderToggleSetting(
            'Anonymous Analytics',
            'Help improve the app with usage statistics',
            settings.privacy.anonymousAnalytics,
            () => updateSetting(['privacy', 'anonymousAnalytics'], !settings.privacy.anonymousAnalytics),
            'Toggle anonymous analytics collection',
            '📊'
          )}
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            ♿ Accessibility
          </AccessibleText>
          
          {renderToggleSetting(
            'High Contrast Mode',
            'Use higher contrast colors for better visibility',
            settings.accessibility.highContrast,
            () => updateSetting(['accessibility', 'highContrast'], !settings.accessibility.highContrast),
            'Toggle high contrast mode',
            '🎨'
          )}

          {renderToggleSetting(
            'Large Text',
            'Use larger text throughout the app',
            settings.accessibility.largeText,
            () => updateSetting(['accessibility', 'largeText'], !settings.accessibility.largeText),
            'Toggle large text mode',
            '🔍'
          )}

          {renderToggleSetting(
            'Screen Reader Support',
            'Optimize for screen reader accessibility',
            settings.accessibility.screenReader,
            () => updateSetting(['accessibility', 'screenReader'], !settings.accessibility.screenReader),
            'Toggle screen reader optimizations',
            '👁️'
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            ⚙️ Preferences
          </AccessibleText>
          
          {renderOptionSetting(
            'Default Time Range',
            'Default time period for analytics views',
            settings.preferences.defaultTimeRange,
            [
              { value: '24h', label: '24 Hours' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
            ],
            (value) => updateSetting(['preferences', 'defaultTimeRange'], value)
          )}

          {renderToggleSetting(
            'Auto Refresh',
            'Automatically refresh data when app becomes active',
            settings.preferences.autoRefresh,
            () => updateSetting(['preferences', 'autoRefresh'], !settings.preferences.autoRefresh),
            'Toggle automatic data refresh',
            '🔄'
          )}

          {renderToggleSetting(
            'Detailed Analytics',
            'Show detailed breakdowns in charts and metrics',
            settings.preferences.detailedAnalytics,
            () => updateSetting(['preferences', 'detailedAnalytics'], !settings.preferences.detailedAnalytics),
            'Toggle detailed analytics display',
            '📈'
          )}
        </View>

        {/* Data & Account Section */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            🗂️ Data & Account
          </AccessibleText>
          
          {renderActionSetting(
            'Export Data',
            'Download a copy of your data and analytics',
            'Export',
            handleExportData,
            'secondary'
          )}

          {renderActionSetting(
            'Reset Settings',
            'Reset all settings to their default values',
            'Reset',
            handleResetSettings,
            'secondary'
          )}

          {renderActionSetting(
            'Delete Account',
            'Permanently delete your account and all data',
            'Delete',
            handleDeleteAccount,
            'danger'
          )}
        </View>

        {/* Development Testing */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            🧪 Development Testing
          </AccessibleText>
          
          <AccessibleCard style={StyleSheet.flatten([styles.infoCard, { borderColor: theme.border, backgroundColor: theme.card }, Elevation.sm])}>
            <FlexLayout gap={Spacing.md}>
              <AccessibleText variant="body" style={{ color: theme.textSecondary }}>
                Test token expiration behavior
              </AccessibleText>
              
              <AccessibleButton
                title="Simulate Expired Token"
                variant="secondary"
                onPress={async () => {
                  try {
                    // Set token expiry to past date
                    const expiredDate = mockAuthAPI.simulateExpiredToken();
                    await AsyncStorage.setItem('auth_token_expiry', expiredDate);
                    
                    Alert.alert(
                      'Token Expired', 
                      'Token expiry has been set to the past. Restart the app or navigate away and back to trigger token validation.',
                      [
                        { text: 'OK', style: 'default' }
                      ]
                    );
                  } catch (error) {
                    Alert.alert('Error', 'Failed to simulate token expiration');
                  }
                }}
                accessibilityLabel="Simulate an expired authentication token for testing"
              />
            </FlexLayout>
          </AccessibleCard>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.sectionTitle, { color: theme.text }])}>
            ℹ️ App Information
          </AccessibleText>
          
          <AccessibleCard style={StyleSheet.flatten([styles.infoCard, { borderColor: theme.border, backgroundColor: theme.card }, Elevation.sm])}>
            <FlexLayout gap={Spacing.md}>
              <FlexLayout direction="row" justify="space-between">
                <AccessibleText variant="body" style={{ color: theme.text }}>Version</AccessibleText>
                <AccessibleText variant="body" style={StyleSheet.flatten([styles.infoValue, { color: theme.textSecondary }])}>1.0.0</AccessibleText>
              </FlexLayout>
              <FlexLayout direction="row" justify="space-between">
                <AccessibleText variant="body" style={{ color: theme.text }}>Last Updated</AccessibleText>
                <AccessibleText variant="body" style={StyleSheet.flatten([styles.infoValue, { color: theme.textSecondary }])}>October 13, 2025</AccessibleText>
              </FlexLayout>
              <TouchableOpacity
                onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would be displayed here.')}
                accessibilityRole="button"
                accessibilityLabel="View Privacy Policy"
              >
                <AccessibleText variant="body" style={StyleSheet.flatten([styles.linkText, { color: theme.primary }])}>
                  Privacy Policy
                </AccessibleText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Alert.alert('Terms of Service', 'Terms of service would be displayed here.')}
                accessibilityRole="button"
                accessibilityLabel="View Terms of Service"
              >
                <AccessibleText variant="body" style={StyleSheet.flatten([styles.linkText, { color: theme.primary }])}>
                  Terms of Service
                </AccessibleText>
              </TouchableOpacity>
            </FlexLayout>
          </AccessibleCard>
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: 16,
    fontWeight: '400',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
    fontSize: 20,
    fontWeight: '600',
  },
  // Modern setting cards
  settingCard: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  settingIconText: {
    fontSize: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  // Option buttons
  optionButtons: {
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  // Info card
  infoCard: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});