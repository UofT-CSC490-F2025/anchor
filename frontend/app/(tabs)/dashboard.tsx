import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  useWindowDimensions,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton, AccessibleCard } from '@/components/ui/AccessibleComponents';
import { TikTokFeed } from '@/components/tiktok/TikTokFeed';
import { useAuth } from '@/contexts/AuthContext';
import { useTikTok } from '@/contexts/TikTokContext';
import { useContentService } from '@/hooks/useApiServices';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { getChartData, getFlaggedChartData, getContentTypePieData } from '@/utils/chartHelpers';
import type { AnalyticsData, FlaggedContent } from '@/types';

export default function DashboardScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentFlags, setRecentFlags] = useState<FlaggedContent[]>([]);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // URL submission state (simplified version for dashboard)
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);

  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const { isLinked: isTikTokLinked, refreshFeed: refreshTikTokFeed } = useTikTok();
  
  // Always call the hook to avoid conditional hook usage
  const contentService = useContentService();

  const loadDashboardData = useCallback(async (showRefresh = false) => {
    if (!isAuthenticated || !contentService) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await contentService.getDashboardSummary();
      setAnalyticsData(data.analytics);
      setRecentFlags(data.recentFlags);
      setPendingReviews(data.pendingReviews);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, contentService]);

  useEffect(() => {
    if (isAuthenticated && contentService && !authLoading) {
      loadDashboardData();
    }
  }, [isAuthenticated, contentService, authLoading, loadDashboardData]);

  const onRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Simplified URL submission for dashboard
  const submitUrlFromDashboard = async () => {
    if (!urlInput.trim()) {
      Alert.alert('Error', 'Please enter a TikTok URL');
      return;
    }

    setIsSubmittingUrl(true);
    try {
      // Simulate API call - same logic as in Content tab but simpler UI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success!', 
        'URL submitted for analysis! Check the Content tab to see results.',
        [{ text: 'OK', onPress: () => {
          setUrlInput('');
          setShowUrlModal(false);
        }}]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit URL. Please try again.');
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  const handleTimeRangeChange = async (timeRange: '24h' | '7d' | '30d') => {
    if (!contentService) return;
    
    setSelectedTimeRange(timeRange);
    try {
      setLoading(true);
      const data = await contentService.getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to update time range:', error);
      Alert.alert('Error', 'Failed to update time range. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    backgroundGradientFrom: isDark ? '#1C1C1E' : '#FFFFFF',
    backgroundGradientTo: isDark ? '#1C1C1E' : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(0, 132, 255, ${opacity})` : `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: isDark ? '#0084FF' : '#007AFF',
    },
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, progress?: number, color?: string) => (
    <Pressable
      style={[styles.metricCard, { backgroundColor: theme.card }, Elevation.md]}
      accessibilityLabel={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={color ? [`${color}10`, `${color}05`] : [`${theme.primary}10`, `${theme.primary}05`]}
        style={styles.metricCardGradient}
      >
        <View style={styles.metricCardContent}>
          <View style={styles.metricHeader}>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.metricTitle, { color: theme.textSecondary }])}>
              {title}
            </AccessibleText>
            <View style={StyleSheet.flatten([styles.metricIcon, { backgroundColor: `${color || theme.primary}20` }])}>
              <AccessibleText style={StyleSheet.flatten([styles.metricIconText, { color: color || theme.primary }])}>
                {getMetricIcon(title)}
              </AccessibleText>
            </View>
          </View>
          <AccessibleText variant="heading2" style={StyleSheet.flatten([styles.metricValue, { color: theme.text }])}>
            {value}
          </AccessibleText>
          {subtitle && (
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.metricSubtitle, { color: theme.textTertiary }])}>
              {subtitle}
            </AccessibleText>
          )}
          {progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={StyleSheet.flatten([styles.progressTrack, { backgroundColor: theme.interactive }])}>
                <View 
                  style={StyleSheet.flatten([
                    styles.progressFill, 
                    { 
                      backgroundColor: color || theme.success,
                      width: `${Math.max(0, Math.min(100, Number(progress)))}%`
                    }
                  ])} 
                />
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );

  const getMetricIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'total posts': return '📄';
      case 'flagged content': return '🚩';
      case 'ai accuracy': return '🎯';
      case 'pending reviews': return '⏳';
      default: return '📊';
    }
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <AccessibleText variant="label" style={styles.sectionTitle}>
        Time Range
      </AccessibleText>
      <FlexLayout direction="row" gap={8} style={styles.timeRangeButtons}>
        {(['24h', '7d', '30d'] as const).map((range) => (
          <AccessibleButton
            key={range}
            title={range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            variant={selectedTimeRange === range ? 'primary' : 'outline'}
            size="small"
            onPress={() => handleTimeRangeChange(range)}
            accessibilityHint={`Change time range to ${range}`}
          />
        ))}
      </FlexLayout>
    </View>
  );

  const renderEngagementChart = () => {
    if (!analyticsData?.analytics?.engagement_data) return null;

    const chartData = getChartData(analyticsData.analytics);
    const screenWidth = Math.min(width - 32, 350); // Account for padding

    return (
      <AccessibleCard style={StyleSheet.flatten([styles.chartCard, { backgroundColor: theme.card }, Elevation.md])}>
        <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.chartTitle, { color: theme.text }])}>
          Engagement Over Time
        </AccessibleText>
        <View 
          style={styles.chartContainer}
          accessibilityLabel="Engagement trend chart showing daily engagement levels"
          accessibilityRole="image"
        >
          <LineChart
            data={chartData}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </AccessibleCard>
    );
  };

  const renderFlaggedChart = () => {
    if (!analyticsData?.analytics?.engagement_data) return null;

    const chartData = getFlaggedChartData(analyticsData.analytics);
    const screenWidth = Math.min(width - 32, 350);

    return (
      <AccessibleCard style={StyleSheet.flatten([styles.chartCard, { backgroundColor: theme.card }, Elevation.md])}>
        <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.chartTitle, { color: theme.text }])}>
          Flagged Content Trends
        </AccessibleText>
        <View 
          style={styles.chartContainer}
          accessibilityLabel="Flagged content trend chart showing daily flagged content counts"
          accessibilityRole="image"
        >
          <LineChart
            data={chartData}
            width={screenWidth}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </AccessibleCard>
    );
  };

  const renderContentTypePie = () => {
    const pieData = getContentTypePieData(recentFlags);
    const screenWidth = Math.min(width - 32, 300);

    if (pieData.length === 0) return null;

    return (
      <AccessibleCard style={StyleSheet.flatten([styles.chartCard, { backgroundColor: theme.card }, Elevation.md])}>
        <AccessibleText variant="heading3" style={StyleSheet.flatten([styles.chartTitle, { color: theme.text }])}>
          Content Types Flagged
        </AccessibleText>
        <View 
          style={styles.chartContainer}
          accessibilityLabel="Pie chart showing distribution of flagged content types"
          accessibilityRole="image"
        >
          <PieChart
            data={pieData}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      </AccessibleCard>
    );
  };

  const renderRecentFlags = () => (
    <AccessibleCard style={StyleSheet.flatten([styles.recentFlagsCard, { backgroundColor: theme.card }, Elevation.md])}>
      <FlexLayout direction="row" justify="space-between" align="center" style={{ marginBottom: Spacing.md }}>
        <AccessibleText variant="heading3" style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>Recent Flags</AccessibleText>
        <AccessibleButton
          title="View All"
          variant="ghost"
          size="small"
          onPress={() => {/* Navigate to full flags list */}}
          accessibilityHint="View all flagged content"
        />
      </FlexLayout>
      
      {recentFlags.map((flag) => (
        <View key={flag.id} style={StyleSheet.flatten([styles.flagItem, { borderBottomColor: theme.border }])}>
          <FlexLayout direction="row" justify="space-between" align="flex-start">
            <View style={styles.flagContent}>
              <AccessibleText 
                variant="label" 
                style={StyleSheet.flatten([
                  styles.flagType,
                  { color: getTypeColor(flag.detection_labels?.[0]?.label || 'unknown') }
                ])}
              >
                {(flag.detection_labels?.[0]?.label || 'Unknown').replace('_', ' ').toUpperCase()}
              </AccessibleText>
              <AccessibleText variant="body" numberOfLines={2} style={StyleSheet.flatten([styles.flagText, { color: theme.text }])}>
                {flag.title || flag.description || 'No description available'}
              </AccessibleText>
              <AccessibleText variant="caption" style={StyleSheet.flatten([styles.flagMeta, { color: theme.textTertiary }])}>
                {flag.platform} • {formatTimestamp(flag.created_at)}
              </AccessibleText>
            </View>
            <View style={styles.confidenceContainer}>
              <AccessibleText variant="caption" style={StyleSheet.flatten([styles.confidenceLabel, { color: theme.textTertiary }])}>
                Confidence
              </AccessibleText>
              <AccessibleText variant="label" style={StyleSheet.flatten([styles.confidenceValue, { color: theme.text }])}>
                {Math.round((flag.confidence_score || 0) * 100)}%
              </AccessibleText>
            </View>
          </FlexLayout>
        </View>
      ))}
    </AccessibleCard>
  );

  const renderTikTokSection = () => {
    return (
      <AccessibleCard style={StyleSheet.flatten([styles.tiktokCard, { backgroundColor: theme.card }, Elevation.md])}>
        <FlexLayout direction="row" justify="space-between" align="center" style={{ marginBottom: Spacing.md }}>
          <AccessibleText variant="heading3" style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>
            🎵 TikTok Analysis
          </AccessibleText>
          <FlexLayout direction="row" gap={8}>
            <AccessibleButton
              title="Analyze URL"
              variant="outline"
              size="small"
              onPress={() => setShowUrlModal(true)}
              accessibilityHint="Submit a TikTok URL for analysis"
            />
            {isTikTokLinked ? (
              <AccessibleButton
                title="Refresh"
                variant="secondary"
                size="small"
                onPress={refreshTikTokFeed}
                accessibilityHint="Refresh TikTok feed"
              />
            ) : (
              <AccessibleButton
                title="Connect"
                variant="primary"
                size="small"
                onPress={() => Alert.alert('TikTok Integration', 'Navigate to Settings > TikTok Integration to connect your account.')}
                accessibilityHint="Connect your TikTok account for personalized analysis"
              />
            )}
          </FlexLayout>
        </FlexLayout>
        
        <TikTokFeed 
          onLinkAccount={() => Alert.alert('TikTok Integration', 'Navigate to Settings > TikTok Integration to connect your account.')}
        />
      </AccessibleCard>
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      misinformation: '#FF6384',
      hate_speech: '#FF9F40',
      spam: '#FFCD56',
      inappropriate: '#4BC0C0',
    };
    return colors[type as keyof typeof colors] || '#8E8E93';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Show loading or authentication states
  if (authLoading) {
    return (
      <ResponsiveContainer style={styles.loadingContainer}>
        <AccessibleText variant="body">Initializing...</AccessibleText>
      </ResponsiveContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ResponsiveContainer style={styles.loadingContainer}>
        <AccessibleText variant="heading3" style={styles.emptyTitle}>
          Authentication Required
        </AccessibleText>
        <AccessibleText variant="body" style={styles.emptyMessage}>
          Please log in to view your dashboard.
        </AccessibleText>
      </ResponsiveContainer>
    );
  }

  if (loading && !analyticsData) {
    return (
      <ResponsiveContainer style={styles.loadingContainer}>
        <AccessibleText variant="body">Loading dashboard...</AccessibleText>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <AccessibleText variant="heading1" style={StyleSheet.flatten([styles.title, { color: theme.text }])} accessibilityRole="header">
                Dashboard
              </AccessibleText>
              <AccessibleText variant="body" style={StyleSheet.flatten([styles.subtitle, { color: theme.textSecondary }])}>
                Welcome back, {user?.display_name || 'User'}
              </AccessibleText>
            </View>
            <AccessibleButton
              title="Logout"
              variant="ghost"
              size="small"
              onPress={logout}
              style={styles.logoutButton}
              accessibilityLabel="Logout from your account"
            />
          </View>
        </View>

        {renderTimeRangeSelector()}

        {/* Metrics Row */}
        <FlexLayout direction="row" wrap gap={Spacing.sm} style={styles.metricsContainer}>
          {renderMetricCard('Total Videos', analyticsData?.metrics?.total_videos?.toLocaleString() || '0', undefined, undefined, theme.primary)}
          {renderMetricCard('Flagged Content', analyticsData?.metrics?.flagged_videos || 0, undefined, undefined, theme.warning)}
          {renderMetricCard('AI Accuracy', `${analyticsData?.metrics?.accuracy_rate || 0}%`, undefined, analyticsData?.metrics?.accuracy_rate, theme.success)}
          {renderMetricCard('Pending Reviews', pendingReviews, 'Need feedback', undefined, theme.secondary)}
        </FlexLayout>

        {/* TikTok Integration */}
        {renderTikTokSection()}

        {/* Charts */}
        {renderEngagementChart()}
        {renderFlaggedChart()}
        {renderContentTypePie()}

        {/* Recent Flags */}
        {renderRecentFlags()}
      </ScrollView>

      {/* Simple URL Submission Modal */}
      <Modal
        visible={showUrlModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <AccessibleText variant="heading2" style={StyleSheet.flatten([styles.modalTitle, { color: theme.text }])}>
              Quick URL Analysis
            </AccessibleText>
            <Pressable
              onPress={() => setShowUrlModal(false)}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <AccessibleText style={StyleSheet.flatten([styles.closeButtonText, { color: theme.primary }])}>✕</AccessibleText>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <AccessibleText variant="body" style={StyleSheet.flatten([styles.modalDescription, { color: theme.textSecondary }])}>
              Paste a TikTok URL to analyze its content
            </AccessibleText>
            
            <TextInput
              style={[
                styles.urlInput,
                { 
                  backgroundColor: theme.backgroundElevated,
                  borderColor: theme.border,
                  color: theme.text,
                }
              ]}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://www.tiktok.com/@username/video/..."
              placeholderTextColor={theme.textTertiary}
              multiline={false}
              accessibilityLabel="TikTok URL input"
            />

            <View style={styles.modalActions}>
              <AccessibleButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowUrlModal(false)}
                style={[styles.modalButton, { flex: 1 }]}
              />
              <AccessibleButton
                title={isSubmittingUrl ? "Submitting..." : "Submit"}
                variant="primary"
                onPress={submitUrlFromDashboard}
                disabled={isSubmittingUrl || !urlInput.trim()}
                style={[styles.modalButton, { flex: 2 }]}
              />
            </View>

            {isSubmittingUrl && (
              <View style={[styles.modalActions, { justifyContent: 'center', marginTop: Spacing.md }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <AccessibleText variant="caption" style={{ color: theme.textSecondary, marginLeft: 8 }}>
                  Processing...
                </AccessibleText>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
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
  logoutButton: {
    marginTop: Spacing.xs,
  },
  timeRangeContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontSize: 16,
    fontWeight: '600',
  },
  timeRangeButtons: {
    flexWrap: 'wrap',
  },
  metricsContainer: {
    marginBottom: Spacing.lg,
  },
  // Modern metric cards
  metricCard: {
    flex: 1,
    minWidth: 160,
    minHeight: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  metricCardGradient: {
    flex: 1,
    padding: Spacing.md,
  },
  metricCardContent: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricIconText: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: Spacing.xs,
  },
  metricSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Charts
  chartCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  chartTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: BorderRadius.md,
  },
  // Recent flags
  recentFlagsCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  // TikTok section
  tiktokCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  flagItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  flagContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  flagType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  flagText: {
    marginBottom: Spacing.xs,
    fontSize: 15,
    lineHeight: 20,
  },
  flagMeta: {
    fontSize: 13,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontSize: 12,
  },
  confidenceValue: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontSize: 22,
    fontWeight: '600',
  },
    emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    minHeight: 44,
  },
});