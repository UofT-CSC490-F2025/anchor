import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton } from '@/components/ui/AccessibleComponents';
import { ContentFilter, SortControl, ContentCard } from '@/components/ui/InteractiveComponents';
import { FactCheckResults } from '@/components/ui/FactCheckResults';
import { useAuth } from '@/contexts/AuthContext';
import { useApiServices, useFlexibleContentService } from '@/hooks/useApiServices';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { validateTikTokUrl, getExampleUrls } from '@/utils/urlValidation';
import type { FlaggedContent, ContentType } from '@/types';
import type { TikTokPredictResponse } from '@/types/tiktokAnalysis';
import { getAnalysisStatusMessage, isAnalysisSuccessful } from '@/types/tiktokAnalysis';

export default function ContentScreen() {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<ContentType | 'all'>('all');
  const [currentSort, setCurrentSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // URL submission state
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const [urlSubmissionStatus, setUrlSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [analysisResults, setAnalysisResults] = useState<TikTokPredictResponse | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get API services (will return null services if not authenticated)
  const { isReady } = useApiServices();
  const flexibleContentService = useFlexibleContentService();
  const contentService = flexibleContentService; // Use flexible service for all content operations

  const filterOptions = useMemo(() => [
    { value: 'all' as const, label: 'All Types', count: flaggedContent?.length || 0 },
    { value: 'misinformation' as const, label: 'Misinformation', count: flaggedContent?.filter(item => item.detection_labels?.some(label => label.label === 'misinformation'))?.length || 0 },
    { value: 'hate_speech' as const, label: 'Hate Speech', count: flaggedContent?.filter(item => item.detection_labels?.some(label => label.label === 'hate_speech'))?.length || 0 },
    { value: 'spam' as const, label: 'Spam', count: flaggedContent?.filter(item => item.detection_labels?.some(label => label.label === 'spam'))?.length || 0 },
    { value: 'inappropriate' as const, label: 'Inappropriate', count: flaggedContent?.filter(item => item.detection_labels?.some(label => label.label === 'inappropriate'))?.length || 0 },
  ], [flaggedContent]);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'confidence_high', label: 'High Confidence' },
    { value: 'confidence_low', label: 'Low Confidence' },
    { value: 'needs_review', label: 'Needs Review' },
  ];

  const loadContent = useCallback(async (isRefresh = false) => {
    if (!contentService || !isReady) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const filters = {
        ...(currentFilter !== 'all' && { contentType: currentFilter }),
      };

      const currentPage = isRefresh ? 1 : page;
      const response = await contentService.getFlaggedContent(
        currentPage, 
        10,
        filters
      );
      
      // Defensive programming: ensure response.data exists and is an array
      const responseData = Array.isArray(response.data) ? response.data : [];
      
      if (isRefresh) {
        setFlaggedContent(responseData);
        setPage(1); // Reset page counter
      } else {
        setFlaggedContent(prev => [...prev, ...responseData]);
      }
      
      setHasMore(response.pagination?.hasNext || false);
    } catch (error) {
      console.error('Failed to load content:', error);
      Alert.alert('Error', 'Failed to load content. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contentService, currentFilter, isReady]);

  useEffect(() => {
    if (isAuthenticated && contentService && isReady && !authLoading) {
      loadContent();
    }
  }, [isAuthenticated, contentService, isReady, authLoading]);

  // Separate effect for filter changes to avoid infinite loops
  useEffect(() => {
    if (isAuthenticated && contentService && isReady && !authLoading) {
      setPage(1); // Reset page when filter changes
      setFlaggedContent([]); // Clear existing content
      loadContent(true); // Refresh with new filter
    }
  }, [currentFilter]);

  // Function to load more content for pagination
  const loadMoreContent = useCallback(async () => {
    if (!contentService || !isReady || !hasMore || loading) {
      return;
    }

    try {
      setLoading(true);
      const nextPage = page + 1;
      
      const filters = {
        ...(currentFilter !== 'all' && { contentType: currentFilter }),
      };

      const response = await contentService.getFlaggedContent(
        nextPage, 
        10,
        filters
      );
      
      // Defensive programming: ensure response.data exists and is an array
      const responseData = Array.isArray(response.data) ? response.data : [];
      
      setFlaggedContent(prev => [...prev, ...responseData]);
      setHasMore(response.pagination?.hasNext || false);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more content:', error);
      Alert.alert('Error', 'Failed to load more content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [contentService, isReady, hasMore, loading, page, currentFilter]);

  const onRefresh = useCallback(() => {
    loadContent(true);
  }, []);

  // URL Submission functionality
  const submitUrlForAnalysis = async () => {
    const validation = validateTikTokUrl(urlInput);
    
    if (!validation.isValid) {
      setUrlSubmissionStatus({
        type: 'error',
        message: validation.error || 'Please enter a valid TikTok URL'
      });
      return;
    }

    if (!flexibleContentService) {
      setUrlSubmissionStatus({
        type: 'error',
        message: 'Service not available. Please try again later.'
      });
      return;
    }

    setIsSubmittingUrl(true);
    setUrlSubmissionStatus({ type: null, message: '' });

    try {
      console.log('🔍 Submitting URL for analysis:', urlInput.trim());
      
      // Use the flexible service that will route to real or mock API
      const result = await flexibleContentService.analyzeUrl(urlInput.trim());
      
      console.log('✅ Analysis result:', result);
      
      // Validate the response structure before setting it
      if (result && result.fact_check_results) {
        // Store the results for display
        setAnalysisResults(result);
        
        // Use the utility function to generate a proper status message
        const statusMessage = getAnalysisStatusMessage(result);
        
        setUrlSubmissionStatus({
          type: isAnalysisSuccessful(result) ? 'success' : 'error',
          message: statusMessage
        });
      } else {
        console.error('Invalid response structure:', result);
        setUrlSubmissionStatus({
          type: 'error',
          message: 'Received invalid response from analysis service. Please try again.'
        });
        return;
      }
      
      // Clear the input and close modal after a delay
      setTimeout(() => {
        setUrlInput('');
        setShowUrlModal(false);
        setUrlSubmissionStatus({ type: null, message: '' });
        setAnalysisResults(null);
        // Refresh the content list to potentially show new analysis
        loadContent(true);
      }, 8000); // Longer delay to show results

    } catch (error) {
      console.error('❌ Failed to submit URL for analysis:', error);
      setUrlSubmissionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit URL for analysis. Please try again.'
      });
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  const resetUrlModal = () => {
    setUrlInput('');
    setUrlSubmissionStatus({ type: null, message: '' });
    setAnalysisResults(null);
    setIsSubmittingUrl(false);
  };

  const handleShowUrlModal = () => {
    resetUrlModal();
    setShowUrlModal(true);
  };

  const handleFeedbackSubmitted = async (contentId: string, feedback: 'correct' | 'incorrect') => {
    if (!contentService || !isReady) return;

    try {
      // Find the analysis run ID for this content
      const content = flaggedContent.find(item => item.id === contentId);
      const analysisRunId = content?.analysis_runs?.[0]?.id;
      
      if (!analysisRunId) {
        Alert.alert('Error', 'No analysis data available for feedback.');
        return;
      }

      // Convert feedback to rating (correct = 5, incorrect = 1)
      const rating = feedback === 'correct' ? 5 : 1;
      await contentService.submitFeedback(analysisRunId, rating);
      
      // Update local state to reflect the feedback
      setFlaggedContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { ...item, userFeedback: feedback }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const getFilteredAndSortedContent = () => {
    let filtered = flaggedContent;

    // Apply filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.detection_labels?.some(label => label.label === currentFilter)
      );
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (currentSort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'confidence_high':
          const aConfidence = a.confidence_score || 0;
          const bConfidence = b.confidence_score || 0;
          return bConfidence - aConfidence;
        case 'confidence_low':
          const aConfidenceLow = a.confidence_score || 0;
          const bConfidenceLow = b.confidence_score || 0;
          return aConfidenceLow - bConfidenceLow;
        case 'needs_review':
          return (a.userFeedback ? 1 : 0) - (b.userFeedback ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredContent = getFilteredAndSortedContent();

  // Transform VideoWithAnalysis to legacy FlaggedContent format for ContentCard compatibility
  const transformContentForCard = (item: FlaggedContent): {
    id: string;
    type: 'misinformation' | 'hate_speech' | 'spam' | 'inappropriate';
    content: string;
    platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok';
    confidenceScore: number;
    timestamp: string;
    userFeedback?: 'correct' | 'incorrect' | null;
    reasons: string[];
  } => {
    const primaryLabel = item.detection_labels?.[0];
    
    // Map new ContentType to legacy supported types
    const mapContentType = (label?: string): 'misinformation' | 'hate_speech' | 'spam' | 'inappropriate' => {
      if (!label) return 'inappropriate';
      
      switch (label) {
        case 'misinformation':
          return 'misinformation';
        case 'hate_speech':
        case 'harassment':
          return 'hate_speech';
        case 'spam':
          return 'spam';
        case 'inappropriate':
        case 'adult_content':
        case 'violence':
        case 'self_harm':
        case 'terrorism':
        case 'child_safety':
        default:
          return 'inappropriate';
      }
    };

    // Map platform to supported platforms
    const mapPlatform = (platform: string): 'twitter' | 'facebook' | 'instagram' | 'tiktok' => {
      switch (platform.toLowerCase()) {
        case 'twitter':
          return 'twitter';
        case 'facebook':
          return 'facebook';
        case 'instagram':
          return 'instagram';
        case 'tiktok':
          return 'tiktok';
        default:
          return 'twitter'; // default fallback
      }
    };
    
    return {
      id: item.id,
      type: mapContentType(primaryLabel?.label),
      content: item.title || item.description || 'No content description',
      platform: mapPlatform(item.platform),
      confidenceScore: item.confidence_score || 0,
      timestamp: item.created_at,
      userFeedback: item.userFeedback || null,
      reasons: item.detection_labels?.map(label => `${label.label}: ${Math.round(label.confidence * 100)}% confidence`) || [],
    };
  };

  // URL Submission card component
  const UrlSubmissionCard = () => (
    <Pressable 
      style={[styles.summaryCard, styles.urlSubmissionCard, { backgroundColor: theme.card }, Elevation.md]}
      onPress={handleShowUrlModal}
      accessibilityRole="button"
      accessibilityLabel="Submit TikTok URL for analysis"
      accessibilityHint="Opens a modal to enter a TikTok URL for content analysis"
    >
      <LinearGradient
        colors={[`${theme.primary}15`, `${theme.primary}08`]}
        style={styles.summaryCardGradient}
      >
        <View style={styles.summaryCardContent}>
          <View style={[styles.summaryIcon, { backgroundColor: `${theme.primary}20` }]}>
            <AccessibleText style={StyleSheet.flatten([styles.summaryIconText, { color: theme.primary }])}>➕</AccessibleText>
          </View>
          <View style={styles.summaryTextContainer}>
            <AccessibleText variant="body" style={StyleSheet.flatten([styles.urlSubmissionTitle, { color: theme.text }])}>
              Analyze URL
            </AccessibleText>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.urlSubmissionSubtitle, { color: theme.textSecondary }])}>
              Submit TikTok content
            </AccessibleText>
            <AccessibleText variant="caption" style={StyleSheet.flatten([styles.urlSubmissionDescription, { color: theme.textTertiary }])}>
              for AI analysis
            </AccessibleText>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

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
    const totalFlagged = flaggedContent?.length || 0;
    const needsReview = flaggedContent?.filter(item => !item.userFeedback)?.length || 0;
    const highConfidence = flaggedContent?.filter(item => (item.confidence_score || 0) > 0.8)?.length || 0;
    const todayFlagged = flaggedContent?.filter(item => {
      const today = new Date();
      const itemDate = new Date(item.created_at);
      return itemDate.toDateString() === today.toDateString();
    })?.length || 0;

    return (
      <View style={styles.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScrollContent}>
          <UrlSubmissionCard />
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
            onFilterChange={(filter: string) => setCurrentFilter(filter as ContentType | 'all')}
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
            Showing {filteredContent.length} of {flaggedContent?.length || 0} items
          </AccessibleText>
        )}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: FlaggedContent }) => (
    <ContentCard
      content={transformContentForCard(item)}
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
          Please log in to view your content analysis.
        </AccessibleText>
      </ResponsiveContainer>
    );
  }

  if (loading && (flaggedContent?.length || 0) === 0) {
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
            loadMoreContent();
          }
        }}
        onEndReachedThreshold={0.1}
      />

      {/* URL Submission Modal */}
      <Modal
        visible={showUrlModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <AccessibleText variant="heading2" style={StyleSheet.flatten([styles.modalTitle, { color: theme.text }])}>
              Analyze TikTok Content
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

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.inputSection}>
              <AccessibleText variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: theme.text }])}>
                TikTok URL
              </AccessibleText>
              <AccessibleText variant="caption" style={StyleSheet.flatten([styles.inputDescription, { color: theme.textSecondary }])}>
                Paste a TikTok video or post URL for AI-powered content analysis
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
                placeholder="https://www.tiktok.com/@username/video/1234567890"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="TikTok URL input"
                accessibilityHint="Enter the URL of the TikTok content you want to analyze"
              />

              {urlSubmissionStatus.type && (
                <View style={[
                  styles.statusMessage,
                  { 
                    backgroundColor: urlSubmissionStatus.type === 'success' ? `${theme.success}15` : `${theme.error}15`,
                    borderColor: urlSubmissionStatus.type === 'success' ? theme.success : theme.error,
                  }
                ]}>
                  <AccessibleText 
                    style={StyleSheet.flatten([
                      styles.statusMessageText,
                      { color: urlSubmissionStatus.type === 'success' ? theme.success : theme.error }
                    ])}
                  >
                    {urlSubmissionStatus.message}
                  </AccessibleText>
                </View>
              )}
            </View>

            <View style={styles.exampleSection}>
              <AccessibleText variant="body" style={StyleSheet.flatten([styles.exampleTitle, { color: theme.text }])}>
                Supported URL formats:
              </AccessibleText>
              <View style={styles.exampleList}>
                {getExampleUrls('tiktok').map((example, index) => (
                  <AccessibleText key={index} variant="caption" style={StyleSheet.flatten([styles.exampleItem, { color: theme.textSecondary }])}>
                    • {example}
                  </AccessibleText>
                ))}
              </View>
            </View>

            <View style={styles.actionSection}>
              <AccessibleButton
                title={isSubmittingUrl ? "Analyzing..." : "Submit for Analysis"}
                variant="primary"
                onPress={submitUrlForAnalysis}
                disabled={isSubmittingUrl || !urlInput.trim()}
                style={styles.submitButton}
                accessibilityLabel="Submit TikTok URL for content analysis"
              />
              
              {isSubmittingUrl && (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <AccessibleText variant="caption" style={StyleSheet.flatten([styles.loadingText, { color: theme.textSecondary }])}>
                    Processing your request...
                  </AccessibleText>
                </View>
              )}
            </View>

            {/* Analysis Results */}
            {analysisResults && analysisResults.fact_check_results && (
              <View style={styles.resultsSection}>
                <FactCheckResults
                  url={urlInput}
                  analysisResponse={analysisResults}
                />
              </View>
            )}
          </ScrollView>
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
  // URL Submission Card styles
  urlSubmissionCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  urlSubmissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  urlSubmissionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  urlSubmissionDescription: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
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
    fontSize: 24,
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
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100, // Extra space for keyboard
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusMessage: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusMessageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  exampleSection: {
    marginBottom: Spacing.xl,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  exampleList: {
    gap: Spacing.xs,
  },
  exampleItem: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  actionSection: {
    gap: Spacing.md,
  },
  submitButton: {
    minHeight: 50,
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Results section
  resultsSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
