import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccessibleText, AccessibleButton, AccessibleCard } from './AccessibleComponents';
import { FlexLayout, useScreenSize } from '../responsive/ResponsiveLayout';
import { FlaggedContent, mockApiService } from '@/services/mockApi';

interface FeedbackButtonsProps {
  contentId: string;
  currentFeedback?: 'correct' | 'incorrect' | null;
  onFeedbackSubmitted: (feedback: 'correct' | 'incorrect') => void;
  size?: 'small' | 'medium';
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  contentId,
  currentFeedback,
  onFeedbackSubmitted,
  size = 'medium',
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (feedback: 'correct' | 'incorrect') => {
    try {
      setSubmitting(true);
      const success = await mockApiService.submitFeedback(contentId, feedback);
      if (success) {
        onFeedbackSubmitted(feedback);
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const getButtonVariant = (feedbackType: 'correct' | 'incorrect') => {
    if (currentFeedback === feedbackType) return 'primary';
    return 'outline';
  };

  const buttonSize = size === 'small' ? 'small' : 'medium';

  return (
    <FlexLayout direction="row" gap={8} style={styles.feedbackContainer}>
      <AccessibleButton
        title="✓ Correct"
        variant={getButtonVariant('correct')}
        size={buttonSize}
        loading={submitting}
        onPress={() => handleFeedback('correct')}
        accessibilityLabel="Mark as correctly flagged"
        accessibilityHint="Confirm that this content was appropriately flagged"
        accessibilityState={{ selected: currentFeedback === 'correct' }}
        disabled={submitting}
      />
      <AccessibleButton
        title="✗ Incorrect"
        variant={getButtonVariant('incorrect')}
        size={buttonSize}
        loading={submitting}
        onPress={() => handleFeedback('incorrect')}
        accessibilityLabel="Mark as incorrectly flagged"
        accessibilityHint="Report that this content was inappropriately flagged"
        accessibilityState={{ selected: currentFeedback === 'incorrect' }}
        disabled={submitting}
      />
    </FlexLayout>
  );
};

interface ContentFilterProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  filterOptions: Array<{ value: string; label: string; count?: number }>;
}

export const ContentFilter: React.FC<ContentFilterProps> = ({
  currentFilter,
  onFilterChange,
  filterOptions,
}) => {
  const { isPhone } = useScreenSize();
  const [showModal, setShowModal] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedOption = filterOptions.find(option => option.value === currentFilter);

  const FilterButton: React.FC<{ option: typeof filterOptions[0] }> = ({ option }) => (
    <AccessibleButton
      title={`${option.label}${option.count ? ` (${option.count})` : ''}`}
      variant={currentFilter === option.value ? 'primary' : 'outline'}
      size="small"
      onPress={() => {
        onFilterChange(option.value);
        setShowModal(false);
      }}
      accessibilityLabel={`Filter by ${option.label}${option.count ? `, ${option.count} items` : ''}`}
      accessibilityState={{ selected: currentFilter === option.value }}
    />
  );

  if (isPhone) {
    return (
      <>
        <TouchableOpacity
          style={styles.filterTrigger}
          onPress={() => setShowModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filter options"
        >
          <AccessibleText variant="label" style={styles.filterLabel}>
            Filter: {selectedOption?.label || 'All'}
          </AccessibleText>
          <AccessibleText variant="body" style={styles.filterArrow}>
            ▼
          </AccessibleText>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <AccessibleText variant="heading3" style={styles.modalTitle}>
                Filter Content
              </AccessibleText>
              
              <View style={styles.filterGrid}>
                {filterOptions.map((option) => (
                  <View key={option.value} style={styles.filterButtonContainer}>
                    <FilterButton option={option} />
                  </View>
                ))}
              </View>

              <AccessibleButton
                title="Close"
                variant="outline"
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <FlexLayout direction="row" wrap gap={8} style={styles.filterContainer}>
      {filterOptions.map((option) => (
        <FilterButton key={option.value} option={option} />
      ))}
    </FlexLayout>
  );
};

interface SortControlProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  sortOptions: Array<{ value: string; label: string }>;
}

export const SortControl: React.FC<SortControlProps> = ({
  currentSort,
  onSortChange,
  sortOptions,
}) => {
  const [showModal, setShowModal] = useState(false);
  const { isPhone } = useScreenSize();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedOption = sortOptions.find(option => option.value === currentSort);

  if (isPhone) {
    return (
      <>
        <TouchableOpacity
          style={styles.sortTrigger}
          onPress={() => setShowModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Change sort order"
        >
          <AccessibleText variant="label" style={styles.sortLabel}>
            Sort: {selectedOption?.label || 'Default'}
          </AccessibleText>
          <AccessibleText variant="body" style={styles.sortArrow}>
            ▼
          </AccessibleText>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <AccessibleText variant="heading3" style={styles.modalTitle}>
                Sort By
              </AccessibleText>
              
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    currentSort === option.value && styles.sortOptionSelected
                  ]}
                  onPress={() => {
                    onSortChange(option.value);
                    setShowModal(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: currentSort === option.value }}
                >
                  <AccessibleText
                    variant="body"
                    style={{
                      ...styles.sortOptionText,
                      ...(currentSort === option.value && styles.sortOptionTextSelected)
                    }}
                  >
                    {option.label}
                  </AccessibleText>
                  {currentSort === option.value && (
                    <AccessibleText variant="body" style={styles.checkmark}>
                      ✓
                    </AccessibleText>
                  )}
                </TouchableOpacity>
              ))}

              <AccessibleButton
                title="Close"
                variant="outline"
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <FlexLayout direction="row" gap={8} style={styles.sortContainer}>
      <AccessibleText variant="label">Sort by:</AccessibleText>
      {sortOptions.map((option) => (
        <AccessibleButton
          key={option.value}
          title={option.label}
          variant={currentSort === option.value ? 'primary' : 'ghost'}
          size="small"
          onPress={() => onSortChange(option.value)}
          accessibilityState={{ selected: currentSort === option.value }}
        />
      ))}
    </FlexLayout>
  );
};

interface ContentCardProps {
  content: FlaggedContent;
  onFeedbackSubmitted: (contentId: string, feedback: 'correct' | 'incorrect') => void;
  showDetailedView?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onFeedbackSubmitted,
  showDetailedView = false,
}) => {
  const [expanded, setExpanded] = useState(false);

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

  const cardProps = {
    style: styles.contentCard,
    accessibilityLabel: `Flagged content: ${content.type.replace('_', ' ')} on ${content.platform}`,
    ...(showDetailedView && {
      onPress: () => setExpanded(!expanded),
      accessibilityHint: expanded ? 'Tap to collapse details' : 'Tap to expand details'
    })
  };

  return (
    <AccessibleCard {...cardProps}>
      <FlexLayout direction="row" justify="space-between" align="flex-start">
        <View style={styles.contentHeader}>
          <FlexLayout direction="row" align="center" gap={8}>
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(content.type) }]} />
            <AccessibleText
              variant="label"
              style={{
                ...styles.contentType,
                color: getTypeColor(content.type)
              }}
            >
              {content.type.replace('_', ' ').toUpperCase()}
            </AccessibleText>
            <AccessibleText variant="caption" style={styles.platform}>
              {content.platform}
            </AccessibleText>
          </FlexLayout>
          <AccessibleText variant="caption" style={styles.timestamp}>
            {formatTimestamp(content.timestamp)}
          </AccessibleText>
        </View>

        <View style={styles.confidenceContainer}>
          <AccessibleText variant="caption" style={styles.confidenceLabel}>
            Confidence
          </AccessibleText>
          <AccessibleText variant="label" style={styles.confidenceValue}>
            {Math.round(content.confidenceScore * 100)}%
          </AccessibleText>
        </View>
      </FlexLayout>

      <AccessibleText
        variant="body"
        {...(!expanded && { numberOfLines: 2 })}
        style={styles.contentText}
      >
        {content.content}
      </AccessibleText>

      {(expanded || showDetailedView) && content.reasons && (
        <View style={styles.reasonsContainer}>
          <AccessibleText variant="label" style={styles.reasonsTitle}>
            Flagging Reasons:
          </AccessibleText>
          {content.reasons.map((reason, index) => (
            <AccessibleText key={index} variant="body" style={styles.reason}>
              • {reason}
            </AccessibleText>
          ))}
        </View>
      )}

      <FlexLayout direction="row" justify="space-between" align="center" style={styles.contentActions}>
        <FeedbackButtons
          contentId={content.id}
          currentFeedback={content.userFeedback ?? null}
          onFeedbackSubmitted={(feedback) => onFeedbackSubmitted(content.id, feedback)}
          size="small"
        />

        {content.userFeedback && (
          <View style={styles.feedbackStatus}>
            <AccessibleText
              variant="caption" 
              style={{
                ...styles.feedbackText,
                color: content.userFeedback === 'correct' ? '#34C759' : '#FF3B30'
              }}
            >
              Marked as {content.userFeedback}
            </AccessibleText>
          </View>
        )}
      </FlexLayout>
    </AccessibleCard>
  );
};

const styles = StyleSheet.create({
  feedbackContainer: {
    alignItems: 'center',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    minHeight: 44,
  },
  filterLabel: {
    flex: 1,
  },
  filterArrow: {
    marginLeft: 8,
    fontSize: 12,
  },
  sortContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    minHeight: 44,
  },
  sortLabel: {
    flex: 1,
  },
  sortArrow: {
    marginLeft: 8,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterButtonContainer: {
    minWidth: '45%',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#007AFF',
  },
  sortOptionText: {
    flex: 1,
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 12,
  },
  contentCard: {
    marginBottom: 12,
  },
  contentHeader: {
    flex: 1,
    marginRight: 12,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentType: {
    fontSize: 12,
    fontWeight: '600',
  },
  platform: {
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  timestamp: {
    marginTop: 4,
    opacity: 0.7,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    opacity: 0.7,
  },
  confidenceValue: {
    fontWeight: '600',
  },
  contentText: {
    marginVertical: 12,
    lineHeight: 20,
  },
  reasonsContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  reasonsTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  reason: {
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 18,
  },
  contentActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  feedbackStatus: {
    alignItems: 'flex-end',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '500',
  },
});