/**
 * Chart Helper Functions
 * Utility functions for generating chart data from analytics
 */

import type { ContentAnalytics, FlaggedContent } from '@/types';

export const getChartData = (analytics: ContentAnalytics) => {
  return {
    labels: analytics.engagement_data.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: analytics.engagement_data.map(item => item.videos_analyzed),
        color: (opacity = 1) => `rgba(46, 125, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
};

export const getFlaggedChartData = (analytics: ContentAnalytics) => {
  return {
    labels: analytics.engagement_data.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: analytics.engagement_data.map(item => item.flagged_count),
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
};

export const getContentTypePieData = (flaggedContent: FlaggedContent[]) => {
  const typeCounts: Record<string, number> = {};
  
  flaggedContent.forEach(item => {
    item.detection_labels?.forEach(label => {
      typeCounts[label.label] = (typeCounts[label.label] || 0) + 1;
    });
  });

  const colors = {
    misinformation: '#FF6384',
    hate_speech: '#FF9F40',
    spam: '#FFCD56',
    inappropriate: '#4BC0C0',
    violence: '#36A2EB',
    adult_content: '#FF6384',
    harassment: '#FF9F40',
    self_harm: '#FFCD56',
    terrorism: '#4BC0C0',
    child_safety: '#36A2EB',
  };

  return Object.entries(typeCounts).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    population: count,
    color: colors[type as keyof typeof colors] || '#8E8E93',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));
};