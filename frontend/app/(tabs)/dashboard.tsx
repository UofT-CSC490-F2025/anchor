import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton, AccessibleCard } from '@/components/ui/AccessibleComponents';
import { mockApiService, AnalyticsData, FlaggedContent, getChartData, getFlaggedChartData, getContentTypePieData } from '@/services/mockApi';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

export default function DashboardScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentFlags, setRecentFlags] = useState<FlaggedContent[]>([]);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];

  const loadDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await mockApiService.getDashboardSummary();
      setAnalyticsData(data.analytics);
      setRecentFlags(data.recentFlags);
      setPendingReviews(data.pendingReviews);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  const handleTimeRangeChange = async (timeRange: '24h' | '7d' | '30d') => {
    setSelectedTimeRange(timeRange);
    try {
      setLoading(true);
      const data = await mockApiService.getAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to update time range');
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
    if (!analyticsData?.engagementData) return null;

    const chartData = getChartData(analyticsData.engagementData);
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
    if (!analyticsData?.engagementData) return null;

    const chartData = getFlaggedChartData(analyticsData.engagementData);
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
                  { color: getTypeColor(flag.type) }
                ])}
              >
                {flag.type.replace('_', ' ').toUpperCase()}
              </AccessibleText>
              <AccessibleText variant="body" numberOfLines={2} style={StyleSheet.flatten([styles.flagText, { color: theme.text }])}>
                {flag.content}
              </AccessibleText>
              <AccessibleText variant="caption" style={StyleSheet.flatten([styles.flagMeta, { color: theme.textTertiary }])}>
                {flag.platform} • {formatTimestamp(flag.timestamp)}
              </AccessibleText>
            </View>
            <View style={styles.confidenceContainer}>
              <AccessibleText variant="caption" style={StyleSheet.flatten([styles.confidenceLabel, { color: theme.textTertiary }])}>
                Confidence
              </AccessibleText>
              <AccessibleText variant="label" style={StyleSheet.flatten([styles.confidenceValue, { color: theme.text }])}>
                {Math.round(flag.confidenceScore * 100)}%
              </AccessibleText>
            </View>
          </FlexLayout>
        </View>
      ))}
    </AccessibleCard>
  );

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
          <AccessibleText variant="heading1" style={StyleSheet.flatten([styles.title, { color: theme.text }])} accessibilityRole="header">
            Dashboard
          </AccessibleText>
          <AccessibleText variant="body" style={StyleSheet.flatten([styles.subtitle, { color: theme.textSecondary }])}>
            Social Media Analytics & Content Monitoring
          </AccessibleText>
        </View>

        {renderTimeRangeSelector()}

        {/* Metrics Row */}
        <FlexLayout direction="row" wrap gap={Spacing.sm} style={styles.metricsContainer}>
          {renderMetricCard('Total Posts', analyticsData?.totalPosts.toLocaleString() || '0', undefined, undefined, theme.primary)}
          {renderMetricCard('Flagged Content', analyticsData?.flaggedContent || 0, undefined, undefined, theme.warning)}
          {renderMetricCard('AI Accuracy', `${analyticsData?.accuracy || 0}%`, undefined, analyticsData?.accuracy, theme.success)}
          {renderMetricCard('Pending Reviews', pendingReviews, 'Need feedback', undefined, theme.secondary)}
        </FlexLayout>

        {/* Charts */}
        {renderEngagementChart()}
        {renderFlaggedChart()}
        {renderContentTypePie()}

        {/* Recent Flags */}
        {renderRecentFlags()}
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
});