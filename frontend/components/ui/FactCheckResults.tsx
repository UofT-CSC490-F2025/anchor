/**
 * Fact Check Results Component
 * Displays ClaimBuster API results in a user-friendly format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { AccessibleText, AccessibleCard } from '@/components/ui/AccessibleComponents';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface Claim {
  claim_text: string;
  score: number;
}

interface AnalysisResult {
  claims: Claim[];
}

interface FactCheckResultsProps {
  url?: string;
  analysisResult: AnalysisResult;
}

export function FactCheckResults({ url, analysisResult }: FactCheckResultsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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

      {/* Claims Section */}
      {analysisResult.claims && analysisResult.claims.length > 0 && (
        <View style={styles.section}>
          <AccessibleText variant="label" style={sectionTitleStyles}>
            Claims Detected
          </AccessibleText>
          
          {analysisResult.claims.map((claim, index) => (
            <View key={index} style={styles.claimItem}>
              <AccessibleText 
                style={{
                  ...styles.claimText,
                  color: theme.text,
                }}
              >
                "{claim.claim_text}"
              </AccessibleText>
            </View>
          ))}
        </View>
      )}

      {/* Scores Section */}
      <View style={styles.section}>
        <AccessibleText variant="label" style={sectionTitleStyles}>
          Factuality Assessment
        </AccessibleText>
        
        <View style={styles.scoresContainer}>
          {analysisResult.claims.map((claim, index) => {
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
                    Related: "{claim.claim_text}"
                  </AccessibleText>
                </View>
              </View>
            );
          })}
        </View>
      </View>

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
});