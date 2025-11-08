/**
 * Mock API service for development
 * Simulates backend responses for dashboard analytics, flagged content, and user settings
 */

export interface AnalyticsData {
  totalPosts: number;
  flaggedContent: number;
  accuracy: number;
  timeRange: string;
  engagementData: Array<{
    date: string;
    engagement: number;
    flagged: number;
  }>;
}

export interface FlaggedContent {
  id: string;
  type: 'misinformation' | 'hate_speech' | 'spam' | 'inappropriate';
  content: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok';
  confidenceScore: number;
  timestamp: string;
  userFeedback?: 'correct' | 'incorrect' | null;
  reasons: string[];
}

export interface UserSettings {
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    flaggedContentAlerts: boolean;
  };
  privacy: {
    dataSharing: boolean;
    anonymousAnalytics: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
  preferences: {
    defaultTimeRange: '24h' | '7d' | '30d';
    autoRefresh: boolean;
    detailedAnalytics: boolean;
  };
}

// Mock data
const mockAnalyticsData: AnalyticsData = {
  totalPosts: 1247,
  flaggedContent: 23,
  accuracy: 94.2,
  timeRange: '7d',
  engagementData: [
    { date: '2025-09-30', engagement: 145, flagged: 3 },
    { date: '2025-10-01', engagement: 198, flagged: 5 },
    { date: '2025-10-02', engagement: 167, flagged: 2 },
    { date: '2025-10-03', engagement: 203, flagged: 4 },
    { date: '2025-10-04', engagement: 178, flagged: 6 },
    { date: '2025-10-05', engagement: 189, flagged: 2 },
    { date: '2025-10-06', engagement: 167, flagged: 1 },
  ],
};

const mockFlaggedContent: FlaggedContent[] = [
  {
    id: '1',
    type: 'misinformation',
    content: 'Breaking: Scientists discover that drinking coffee prevents all diseases!',
    platform: 'twitter',
    confidenceScore: 0.89,
    timestamp: '2025-10-06T10:30:00Z',
    userFeedback: null,
    reasons: ['Misleading health claims', 'No credible sources cited'],
  },
  {
    id: '2',
    type: 'hate_speech',
    content: '[Content flagged for hate speech]',
    platform: 'facebook',
    confidenceScore: 0.94,
    timestamp: '2025-10-06T09:15:00Z',
    userFeedback: 'correct',
    reasons: ['Discriminatory language', 'Targeted harassment'],
  },
  {
    id: '3',
    type: 'spam',
    content: 'WIN BIG! Click here for amazing deals! Limited time offer!!!',
    platform: 'instagram',
    confidenceScore: 0.97,
    timestamp: '2025-10-06T08:45:00Z',
    userFeedback: null,
    reasons: ['Promotional spam', 'Excessive capitalization', 'Suspicious links'],
  },
  {
    id: '4',
    type: 'inappropriate',
    content: '[Content flagged for inappropriate material]',
    platform: 'tiktok',
    confidenceScore: 0.78,
    timestamp: '2025-10-05T22:20:00Z',
    userFeedback: 'incorrect',
    reasons: ['Potentially inappropriate imagery'],
  },
];

const mockUserSettings: UserSettings = {
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

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiService = {
  // Analytics endpoints
  async getAnalytics(timeRange?: string): Promise<AnalyticsData> {
    await delay(800);
    return {
      ...mockAnalyticsData,
      timeRange: timeRange || mockAnalyticsData.timeRange,
    };
  },

  // Flagged content endpoints
  async getFlaggedContent(page = 1, limit = 10): Promise<{
    data: FlaggedContent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await delay(600);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockFlaggedContent.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      total: mockFlaggedContent.length,
      page,
      totalPages: Math.ceil(mockFlaggedContent.length / limit),
    };
  },

  async submitFeedback(contentId: string, feedback: 'correct' | 'incorrect'): Promise<boolean> {
    await delay(400);
    const item = mockFlaggedContent.find(item => item.id === contentId);
    if (item) {
      item.userFeedback = feedback;
      return true;
    }
    return false;
  },

  // User settings endpoints
  async getUserSettings(): Promise<UserSettings> {
    await delay(300);
    return mockUserSettings;
  },

  async updateUserSettings(settings: Partial<UserSettings>): Promise<boolean> {
    await delay(500);
    Object.assign(mockUserSettings, settings);
    return true;
  },

  // Dashboard summary
  async getDashboardSummary(): Promise<{
    analytics: AnalyticsData;
    recentFlags: FlaggedContent[];
    pendingReviews: number;
  }> {
    await delay(1000);
    return {
      analytics: mockAnalyticsData,
      recentFlags: mockFlaggedContent.slice(0, 3),
      pendingReviews: mockFlaggedContent.filter(item => !item.userFeedback).length,
    };
  },
};

// Chart data helpers
export const getChartData = (engagementData: AnalyticsData['engagementData']) => {
  return {
    labels: engagementData.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: engagementData.map(item => item.engagement),
        color: (opacity = 1) => `rgba(46, 125, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
};

export const getFlaggedChartData = (engagementData: AnalyticsData['engagementData']) => {
  return {
    labels: engagementData.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: engagementData.map(item => item.flagged),
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
};

export const getContentTypePieData = (flaggedContent: FlaggedContent[]) => {
  const typeCounts = flaggedContent.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colors = {
    misinformation: '#FF6384',
    hate_speech: '#FF9F40',
    spam: '#FFCD56',
    inappropriate: '#4BC0C0',
  };

  return Object.entries(typeCounts).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    population: count,
    color: colors[type as keyof typeof colors],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));
};