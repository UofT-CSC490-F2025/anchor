import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton } from '@/components/ui/AccessibleComponents';
import { ContentFilter, SortControl, ContentCard } from '@/components/ui/InteractiveComponents';
import { mockApiService, FlaggedContent } from '@/services/mockApi';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

export default function ContentScreen() {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSort, setCurrentSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];

  const filterOptions = [
    { value: 'all', label: 'All Types', count: flaggedContent.length },
    { value: 'misinformation', label: 'Misinformation', count: flaggedContent.filter(item => item.type === 'misinformation').length },
    { value: 'hate_speech', label: 'Hate Speech', count: flaggedContent.filter(item => item.type === 'hate_speech').length },
    { value: 'spam', label: 'Spam', count: flaggedContent.filter(item => item.type === 'spam').length },
    { value: 'inappropriate', label: 'Inappropriate', count: flaggedContent.filter(item => item.type === 'inappropriate').length },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'confidence_high', label: 'High Confidence' },
    { value: 'confidence_low', label: 'Low Confidence' },
    { value: 'needs_review', label: 'Needs Review' },
  ];

  const loadContent = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const response = await mockApiService.getFlaggedContent(isRefresh ? 1 : page, 10);
      
      if (isRefresh) {
        setFlaggedContent(response.data);
      } else {
        setFlaggedContent(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.page < response.totalPages);
      if (!isRefresh) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    loadContent();
  }, []);

  const onRefresh = useCallback(() => {
    loadContent(true);
  }, [loadContent]);

  const handleFeedbackSubmitted = async (contentId: string, feedback: 'correct' | 'incorrect') => {
    setFlaggedContent(prev => 
      prev.map(item => 
        item.id === contentId 
          ? { ...item, userFeedback: feedback }
          : item
      )
    );
  };

  const getFilteredAndSortedContent = () => {
    let filtered = flaggedContent;

    // Apply filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => item.type === currentFilter);
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (currentSort) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'confidence_high':
          return b.confidenceScore - a.confidenceScore;
        case 'confidence_low':
          return a.confidenceScore - b.confidenceScore;
        case 'needs_review':
          return (a.userFeedback ? 1 : 0) - (b.userFeedback ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredContent = getFilteredAndSortedContent();

  // Health app-inspired summary card component
  const SummaryCard = ({ title, value, subtitle, color }: {
    title: string;
    value: number;
    subtitle: string;
    color: string;
  }) => (
    <Pressable 
      style={[styles.summaryCard, { backgroundColor: theme.card }, Elevation.md]}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value} ${subtitle}`}
    >
      <LinearGradient
        colors={[`${color}15`, `${color}08`]}
        style={styles.summaryCardGradient}
      >
        <View style={styles.summaryCardContent}>
          <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
            <AccessibleText style={StyleSheet.flatten([styles.summaryIconText, { color }])}>📊</AccessibleText>
          </View>
          <View style={styles.summaryTextContainer}>
            <AccessibleText variant="heading2" style={StyleSheet.flatten([styles.summaryValue, { color: theme.text }])}>
              {value}
            </AccessibleText>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.summaryTitle, { color: theme.textSecondary }])}>
              {title}
            </AccessibleText>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.summarySubtitle, { color: theme.textTertiary }])}>
              {subtitle}
            </AccessibleText>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  // Health app-inspired summary cards
  const renderSummaryCards = () => {
    const totalFlagged = flaggedContent.length;
    const needsReview = flaggedContent.filter(item => !item.userFeedback).length;
    const highConfidence = flaggedContent.filter(item => item.confidenceScore > 0.8).length;
    const todayFlagged = flaggedContent.filter(item => {
      const today = new Date();
      const itemDate = new Date(item.timestamp);
      return itemDate.toDateString() === today.toDateString();
    }).length;

    return (
      <View style={styles.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScrollContent}>
          <SummaryCard
            title="Today"
            value={todayFlagged}
            subtitle="flagged items"
            color={theme.primary}
          />
          <SummaryCard
            title="Needs Review"
            value={needsReview}
            subtitle="pending feedback"
            color={theme.warning}
          />
          <SummaryCard
            title="High Confidence"
            value={highConfidence}
            subtitle="accurate flags"
            color={theme.success}
          />
          <SummaryCard
            title="Total Flagged"
            value={totalFlagged}
            subtitle="all time"
            color={theme.secondary}
          />
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <AccessibleText variant="heading1" style={StyleSheet.flatten([styles.title, { color: theme.text }])} accessibilityRole="header">
          Content
        </AccessibleText>
        <AccessibleText variant="body" style={StyleSheet.flatten([styles.subtitle, { color: theme.textSecondary }])}>
          AI-powered content monitoring and review
        </AccessibleText>
      </View>

      {renderSummaryCards()}

      <View style={StyleSheet.flatten([styles.controlsContainer, { backgroundColor: theme.backgroundElevated }, Elevation.sm])}>
        <FlexLayout direction="row" justify="space-between" align="center" style={styles.controls}>
          <ContentFilter
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            filterOptions={filterOptions}
          />
          <SortControl
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            sortOptions={sortOptions}
          />
        </FlexLayout>

        {filteredContent.length > 0 && (
          <AccessibleText variant="caption" style={StyleSheet.flatten([styles.resultCount, { color: theme.textTertiary }])}>
            Showing {filteredContent.length} of {flaggedContent.length} items
          </AccessibleText>
        )}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: FlaggedContent }) => (
    <ContentCard
      content={item}
      onFeedbackSubmitted={handleFeedbackSubmitted}
      showDetailedView={false}
    />
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <AccessibleText variant="caption" style={styles.endMessage}>
            You've reached the end of the list
          </AccessibleText>
        </View>
      );
    }

    return (
      <View style={styles.footer}>
        <AccessibleButton
          title="Load More"
          variant="outline"
          onPress={() => loadContent()}
          loading={loading}
          accessibilityLabel="Load more flagged content"
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <AccessibleText variant="heading3" style={styles.emptyTitle}>
        No Content Found
      </AccessibleText>
      <AccessibleText variant="body" style={styles.emptyMessage}>
        {currentFilter === 'all' 
          ? "There's no flagged content to review right now."
          : `No ${currentFilter.replace('_', ' ')} content found with current filters.`
        }
      </AccessibleText>
      <AccessibleButton
        title="Refresh"
        variant="primary"
        onPress={onRefresh}
        style={styles.refreshButton}
      />
    </View>
  );

  if (loading && flaggedContent.length === 0) {
    return (
      <ResponsiveContainer style={styles.loadingContainer}>
        <AccessibleText variant="body">Loading content...</AccessibleText>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <FlatList
        data={filteredContent}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasMore && !loading) {
            loadContent();
          }
        }}
        onEndReachedThreshold={0.1}
      />
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
  listContent: {
    paddingBottom: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  titleContainer: {
    marginBottom: Spacing.lg,
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
  // Health app-inspired summary cards
  summaryContainer: {
    marginBottom: Spacing.lg,
  },
  summaryScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  summaryCard: {
    width: 160,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  summaryCardGradient: {
    flex: 1,
    padding: Spacing.md,
  },
  summaryCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  summaryIconText: {
    fontSize: 18,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summarySubtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  // Controls section
  controlsContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  controls: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  resultCount: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  // Footer and states
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  endMessage: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 60,
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
  refreshButton: {
    minWidth: 120,
  },
});
