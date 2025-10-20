/**
 * TikTok Feed Component
 * Displays user's TikTok feed with analysis insights
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTikTok } from '@/contexts/TikTokContext';
import type { TikTokVideo } from '@/services/mockTikTokService';

import { ResponsiveContainer, FlexLayout } from '@/components/responsive/ResponsiveLayout';
import { AccessibleText, AccessibleButton } from '@/components/ui/AccessibleComponents';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

interface TikTokFeedProps {
  onLinkAccount?: () => void;
}

export function TikTokFeed({ onLinkAccount }: TikTokFeedProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const {
    isLinked,
    isLoading,
    feed,
    feedLoading,
    error,
    profile,
    clearError,
  } = useTikTok();

  useEffect(() => {
    if (error) {
      Alert.alert('TikTok Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  if (!isLinked) {
    return (
      <View style={StyleSheet.flatten([styles.emptyContainer, { backgroundColor: theme.background }])}>
        <View style={StyleSheet.flatten([styles.emptyContent, { backgroundColor: theme.card, ...Elevation.sm }])}>
          <AccessibleText style={styles.emptyIcon}>🎵</AccessibleText>
          <AccessibleText 
            variant="heading2" 
            style={StyleSheet.flatten([styles.emptyTitle, { color: theme.text }])}
          >
            TikTok Not Connected
          </AccessibleText>
          <AccessibleText 
            variant="body" 
            style={StyleSheet.flatten([styles.emptyDescription, { color: theme.textSecondary }])}
          >
            Link your TikTok account to see your feed analysis and content insights.
          </AccessibleText>
          <AccessibleButton
            title="Link TikTok Account"
            variant="primary"
            size="medium"
            onPress={onLinkAccount}
            style={styles.linkButton}
          />
        </View>
      </View>
    );
  }

  if (isLoading && !feed.length) {
    return (
      <View style={StyleSheet.flatten([styles.loadingContainer, { backgroundColor: theme.background }])}>
        <AccessibleText style={StyleSheet.flatten([styles.loadingText, { color: theme.textSecondary }])}>
          Loading your TikTok feed...
        </AccessibleText>
      </View>
    );
  }

  return (
    <ResponsiveContainer style={StyleSheet.flatten([styles.container, { backgroundColor: theme.background }])}>
      {/* Profile Header */}
      {profile && (
        <View style={StyleSheet.flatten([styles.profileHeader, { backgroundColor: theme.card, ...Elevation.sm }])}>
          <Image 
            source={{ uri: profile.avatar_url }} 
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <AccessibleText 
              variant="heading3" 
              style={StyleSheet.flatten([styles.profileName, { color: theme.text }])}
            >
              @{profile.username}
            </AccessibleText>
            <FlexLayout direction="row" gap={16} style={styles.profileStats}>
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
        </View>
      )}

      {/* Feed Content */}
            {/* Feed Content */}
      <View style={styles.feedContent}>
        {feed.length === 0 && !feedLoading ? (
          <View style={styles.emptyContainer}>
            <AccessibleText 
              variant="body" 
              style={StyleSheet.flatten([styles.emptyDescription, { color: theme.textSecondary }])}
            >
              No videos found. Try refreshing or check your TikTok privacy settings.
            </AccessibleText>
          </View>
        ) : (
          feed.map((item, index) => (
            <FeedItem key={`${item.id}_${index}`} video={item} theme={theme} />
          ))
        )}
        {feedLoading && (
          <View style={styles.loadingFooter}>
            <AccessibleText style={StyleSheet.flatten([styles.loadingText, { color: theme.textSecondary }])}>
              Loading more videos...
            </AccessibleText>
          </View>
        )}
      </View>
    </ResponsiveContainer>
  );
}

interface FeedItemProps {
  video: TikTokVideo;
  theme: any;
}

function FeedItem({ video, theme }: FeedItemProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Mock analysis data
  const analysis = {
    sentiment: 'Positive',
    categories: ['Entertainment', 'Lifestyle'],
    engagement_rate: 7.2,
    trending_score: 85,
    content_type: 'Short-form video',
    estimated_watch_time: '00:' + video.duration.toString().padStart(2, '0'),
  };

  return (
    <View style={StyleSheet.flatten([styles.feedItem, { backgroundColor: theme.card, ...Elevation.sm }])}>
      {/* Video Info */}
      <FlexLayout direction="row" gap={12} align="flex-start">
        <Image 
          source={{ uri: video.cover_image_url }} 
          style={styles.videoThumbnail}
        />
        <View style={styles.videoInfo}>
          <AccessibleText 
            variant="body" 
            style={StyleSheet.flatten([styles.videoTitle, { color: theme.text }])}
            numberOfLines={2}
          >
            {video.title}
          </AccessibleText>
          <AccessibleText 
            variant="caption" 
            style={StyleSheet.flatten([styles.videoCreator, { color: theme.textSecondary }])}
          >
            @{video.creator.username}
          </AccessibleText>
          
          {/* Hashtags */}
          {video.hashtags.length > 0 && (
            <FlexLayout direction="row" gap={4} wrap style={styles.hashtags}>
              {video.hashtags.slice(0, 3).map((hashtag, index) => (
                <View key={`${video.id}-hashtag-${index}`} style={StyleSheet.flatten([styles.hashtag, { backgroundColor: `${theme.primary}15` }])}>
                  <AccessibleText 
                    variant="caption" 
                    style={StyleSheet.flatten([styles.hashtagText, { color: theme.primary }])}
                  >
                    #{hashtag}
                  </AccessibleText>
                </View>
              ))}
            </FlexLayout>
          )}

          {/* Video Stats */}
          <FlexLayout direction="row" gap={16} style={styles.videoStats}>
            <View style={styles.statItem}>
              <AccessibleText 
                variant="caption" 
                style={StyleSheet.flatten([styles.statText, { color: theme.textSecondary }])}
              >
                👀 {video.view_count.toLocaleString()}
              </AccessibleText>
            </View>
            <View style={styles.statItem}>
              <AccessibleText 
                variant="caption" 
                style={StyleSheet.flatten([styles.statText, { color: theme.textSecondary }])}
              >
                ❤️ {video.like_count.toLocaleString()}
              </AccessibleText>
            </View>
            <View style={styles.statItem}>
              <AccessibleText 
                variant="caption" 
                style={StyleSheet.flatten([styles.statText, { color: theme.textSecondary }])}
              >
                ⏱️ {video.duration}s
              </AccessibleText>
            </View>
          </FlexLayout>
        </View>
      </FlexLayout>

      {/* Analysis Toggle */}
      <Pressable
        onPress={() => setShowAnalysis(!showAnalysis)}
        style={StyleSheet.flatten([styles.analysisToggle, { backgroundColor: `${theme.primary}10` }])}
      >
        <AccessibleText 
          variant="caption" 
          style={StyleSheet.flatten([styles.analysisToggleText, { color: theme.primary }])}
        >
          {showAnalysis ? '🔍 Hide Analysis' : '🔍 Show Analysis'}
        </AccessibleText>
      </Pressable>

      {/* Analysis Content */}
      {showAnalysis && (
        <View style={StyleSheet.flatten([styles.analysisContent, { backgroundColor: `${theme.primary}05` }])}>
          <FlexLayout direction="row" gap={16} wrap>
            <AnalysisItem 
              label="Sentiment" 
              value={analysis.sentiment} 
              theme={theme} 
            />
            <AnalysisItem 
              label="Engagement Rate" 
              value={`${analysis.engagement_rate}%`} 
              theme={theme} 
            />
            <AnalysisItem 
              label="Trending Score" 
              value={`${analysis.trending_score}/100`} 
              theme={theme} 
            />
            <AnalysisItem 
              label="Content Type" 
              value={analysis.content_type} 
              theme={theme} 
            />
          </FlexLayout>
          
          <View style={styles.categoriesContainer}>
            <AccessibleText 
              variant="caption" 
              style={StyleSheet.flatten([styles.categoriesLabel, { color: theme.textSecondary }])}
            >
              Categories:
            </AccessibleText>
            <FlexLayout direction="row" gap={8} wrap>
              {analysis.categories.map((category, index) => (
                <View key={`${video.id}-category-${index}`} style={StyleSheet.flatten([styles.categoryTag, { backgroundColor: theme.primary }])}>
                  <AccessibleText 
                    variant="caption" 
                    style={StyleSheet.flatten([styles.categoryText, { color: 'white' }])}
                  >
                    {category}
                  </AccessibleText>
                </View>
              ))}
            </FlexLayout>
          </View>
        </View>
      )}
    </View>
  );
}

interface AnalysisItemProps {
  label: string;
  value: string;
  theme: any;
}

function AnalysisItem({ label, value, theme }: AnalysisItemProps) {
  return (
    <View style={styles.analysisItem}>
      <AccessibleText 
        variant="caption" 
        style={StyleSheet.flatten([styles.analysisLabel, { color: theme.textSecondary }])}
      >
        {label}
      </AccessibleText>
      <AccessibleText 
        variant="body" 
        style={StyleSheet.flatten([styles.analysisValue, { color: theme.text }])}
      >
        {value}
      </AccessibleText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyContent: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    maxWidth: 320,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  linkButton: {
    minWidth: 180,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  profileHeader: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  profileStats: {
    // Additional styles if needed
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
  },
  feedContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  feedItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  videoThumbnail: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  videoCreator: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  hashtags: {
    marginBottom: Spacing.sm,
  },
  hashtag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hashtagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  videoStats: {
    marginTop: Spacing.xs,
  },
  statText: {
    fontSize: 12,
  },
  analysisToggle: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  analysisToggleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  analysisContent: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  analysisItem: {
    minWidth: 120,
    marginBottom: Spacing.sm,
  },
  analysisLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 2,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginTop: Spacing.md,
  },
  categoriesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingFooter: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyFeedContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyFeedText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
});