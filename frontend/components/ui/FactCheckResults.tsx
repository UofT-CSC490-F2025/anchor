/**
 * Fact Check Results Component
 * Displays ClaimBuster API results in a user-friendly format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { AccessibleText, AccessibleCard } from '@/components/ui/AccessibleComponents';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import type { TikTokPredictResponse } from '@/types/tiktokAnalysis';

interface FactCheckResultsProps {
  url?: string;
  analysisResponse: TikTokPredictResponse;
}

export function FactCheckResults({ url, analysisResponse }: FactCheckResultsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Extract claims from the backend response
  const claims = analysisResponse.fact_check_results.claims || [];
  const status = analysisResponse.fact_check_results.status;
  const message = analysisResponse.fact_check_results.message;

  const getScoreColor = (score: number): string => {
    if (score >= 0.6) return theme.success;   // High factuality (green)
    if (score >= 0.4) return theme.warning;   // Mixed factuality (yellow)
    if (score >= 0.2) return '#FF6B35';       // Low factuality (orange)
    return theme.error;                       // Very low factuality (red)
  };

  const getScoreInterpretation = (score: number) => {
    if (score >= 0.6) return { level: 'High Factuality', description: 'This content appears to be factually reliable' };
    if (score >= 0.4) return { level: 'Mixed Factuality', description: 'This content contains mixed factual elements' };
    if (score >= 0.2) return { level: 'Low Factuality', description: 'This content has questionable factual accuracy' };
    return { level: 'Very Low Factuality', description: 'This content appears to have significant factual issues' };
  };

  const containerStyles = {
    ...styles.container,
    backgroundColor: theme.card,
  };

  const titleStyles = {
    ...styles.title,
    color: theme.text,
  };

  const fileNameStyles = {
    ...styles.fileName,
    color: theme.textSecondary,
  };

  const sectionTitleStyles = {
    ...styles.sectionTitle,
    color: theme.text,
  };

  return (
    <AccessibleCard style={containerStyles}>
      {/* Header */}
      <AccessibleText variant="heading2" style={titleStyles}>
        📊 Fact-Check Analysis
      </AccessibleText>
      
      {url && (
        <AccessibleText 
          variant="caption" 
          numberOfLines={2}
          style={fileNameStyles}
        >
          URL: {url}
        </AccessibleText>
      )}

      {/* Analysis Status */}
      <View style={styles.section}>
        <AccessibleText variant="label" style={sectionTitleStyles}>
          Analysis Status
        </AccessibleText>
        <AccessibleText 
          style={{
            ...styles.statusText,
            color: status === 'completed' ? theme.success : status === 'failed' ? theme.error : theme.warning,
          }}
        >
          {status === 'completed' ? '✅ Complete' : status === 'failed' ? '❌ Failed' : '⏳ In Progress'}
        </AccessibleText>
        {message && (
          <AccessibleText 
            style={{
              ...styles.messageText,
              color: theme.textSecondary,
            }}
          >
            {message}
          </AccessibleText>
        )}
      </View>

      {/* Claims Section */}
      {claims && claims.length > 0 && (
        <View style={styles.section}>
          <AccessibleText variant="label" style={sectionTitleStyles}>
            Claims Detected ({claims.length})
          </AccessibleText>
          
          {claims.map((claim, index) => (
            <View key={index} style={styles.claimItem}>
              <AccessibleText 
                style={{
                  ...styles.claimText,
                  color: theme.text,
                }}
              >
                "{claim.text}"
              </AccessibleText>
              <AccessibleText 
                style={{
                  ...styles.claimIndex,
                  color: theme.textTertiary,
                }}
              >
                Claim #{claim.index + 1}
              </AccessibleText>
            </View>
          ))}
        </View>
      )}

      {/* Scores Section */}
      {claims && claims.length > 0 && (
        <View style={styles.section}>
          <AccessibleText variant="label" style={sectionTitleStyles}>
            Factuality Assessment
          </AccessibleText>
          
          <View style={styles.scoresContainer}>
            {claims.map((claim, index) => {
              const scoreColor = getScoreColor(claim.score);
              const interpretation = getScoreInterpretation(claim.score);
              
              return (
                <View key={index} style={styles.scoreItem}>
                  <View style={styles.scoreHeader}>
                    <View 
                      style={{
                        ...styles.scoreIndicator,
                        backgroundColor: scoreColor,
                      }}
                      accessibilityLabel={`Factuality score: ${Math.round(claim.score * 100)}%`}
                    />
                    <View style={styles.scoreContent}>
                      <AccessibleText 
                        variant="label" 
                        style={{
                          ...styles.scoreText,
                          color: scoreColor,
                        }}
                      >
                        {interpretation.level}
                      </AccessibleText>
                      <AccessibleText 
                        variant="caption" 
                        style={{
                          ...styles.indexText,
                          color: theme.textTertiary,
                        }}
                      >
                        Score: {Math.round(claim.score * 100)}%
                      </AccessibleText>
                    </View>
                  </View>
                  
                  <AccessibleText 
                    variant="body" 
                    style={{
                      ...styles.scoreDescription,
                      color: theme.textSecondary,
                    }}
                  >
                    {interpretation.description}
                  </AccessibleText>
                  
                  <View style={styles.relatedClaim}>
                    <AccessibleText 
                      variant="caption" 
                      style={{
                        ...styles.resultText,
                        color: theme.textSecondary,
                      }}
                    >
                      Related: "{claim.text}"
                    </AccessibleText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* No Claims Found */}
      {claims.length === 0 && status === 'completed' && (
        <View style={styles.section}>
          <AccessibleText variant="label" style={sectionTitleStyles}>
            Analysis Result
          </AccessibleText>
          <AccessibleText 
            style={{
              ...styles.noClaimsText,
              color: theme.textSecondary,
            }}
          >
            No specific factual claims were detected in this content. The material may be primarily entertainment, personal expression, or non-factual content.
          </AccessibleText>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <AccessibleText 
          variant="caption" 
          style={{
            ...styles.disclaimerText,
            color: theme.textTertiary,
          }}
        >
          This analysis is provided by ClaimBuster AI and should be used as a guide. 
          Always verify information from multiple reliable sources.
        </AccessibleText>
      </View>
    </AccessibleCard>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  fileName: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  claimItem: {
    marginBottom: Spacing.sm,
  },
  claimText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  scoresContainer: {
    gap: Spacing.md,
  },
  scoreItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  scoreContent: {
    flex: 1,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scoreDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  relatedClaim: {
    marginTop: Spacing.xs,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  disclaimerContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  claimIndex: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noClaimsText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: BorderRadius.md,
  },
});