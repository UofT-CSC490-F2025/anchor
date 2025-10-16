/**
 * Mock API Interceptor
 * Intercepts all API calls when MOCK_API is enabled and returns mock data
 */

import { CONFIG } from '@/config/app';
import type { 
  UUID
} from '@/types/database';
import type { 
  FlaggedContent, 
  AnalyticsData, 
  ApiResponse
} from '@/types/api';

// Mock data generators
const generateMockUUID = (): UUID => `mock-${Math.random().toString(36).substr(2, 9)}` as UUID;

const generateMockDate = (daysAgo = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Stable mock data - generated once and reused
const STABLE_USER_ID = generateMockUUID();
const STABLE_TIMESTAMP = generateMockDate();
const STABLE_DATES = {
  today: generateMockDate(0),
  yesterday: generateMockDate(1),
  twoDaysAgo: generateMockDate(2),
  threeDaysAgo: generateMockDate(3),
  fourDaysAgo: generateMockDate(4),
  fiveDaysAgo: generateMockDate(5),
  sixDaysAgo: generateMockDate(6),
  thirtyDaysAgo: generateMockDate(30)
};

// Mock data
const mockFlaggedContent: FlaggedContent[] = [
  {
    id: 'mock-content-001' as UUID,
    user_id: STABLE_USER_ID,
    platform: 'twitter',
    platform_video_id: 'twitter_123',
    url: 'https://twitter.com/user/status/123',
    title: 'Sample flagged tweet',
    description: 'This is a sample flagged tweet with inappropriate content',
    detection_status: 'completed',
    confidence_score: 0.85,
    risk_level: 'high',
    view_count: 1250,
    captions: 'This is a sample flagged tweet with inappropriate content',
    posted_at: STABLE_DATES.yesterday,
    metadata: { flagged_reason: 'inappropriate' },
    created_at: STABLE_DATES.yesterday,
    updated_at: STABLE_DATES.yesterday,
    primaryContentType: 'inappropriate'
  },
  {
    id: 'mock-content-002' as UUID,
    user_id: STABLE_USER_ID,
    platform: 'instagram',
    platform_video_id: 'instagram_456',
    url: 'https://instagram.com/p/456',
    title: 'Sample Instagram post',
    description: 'Sample Instagram post that was flagged for spam',
    detection_status: 'completed',
    confidence_score: 0.92,
    risk_level: 'medium',
    view_count: 856,
    captions: 'Sample Instagram post that was flagged for spam',
    posted_at: STABLE_DATES.twoDaysAgo,
    duration_seconds: 30,
    resolution: { width: 1080, height: 1920 },
    thumbnail_path: '/thumbnails/instagram_456.jpg',
    s3_path: '/videos/instagram_456.mp4',
    metadata: { flagged_reason: 'spam' },
    created_at: STABLE_DATES.twoDaysAgo,
    updated_at: STABLE_DATES.twoDaysAgo,
    primaryContentType: 'spam',
    userFeedback: 'incorrect'
  },
  {
    id: 'mock-content-003' as UUID,
    user_id: STABLE_USER_ID,
    platform: 'facebook',
    platform_video_id: 'facebook_789',
    url: 'https://facebook.com/video/789',
    title: 'Facebook video with hate speech',
    description: 'A Facebook video that contains hate speech content',
    detection_status: 'completed',
    confidence_score: 0.78,
    risk_level: 'high',
    view_count: 2100,
    captions: 'A Facebook video that contains hate speech content',
    posted_at: STABLE_DATES.threeDaysAgo,
    duration_seconds: 45,
    resolution: { width: 1280, height: 720 },
    thumbnail_path: '/thumbnails/facebook_789.jpg',
    s3_path: '/videos/facebook_789.mp4',
    metadata: { flagged_reason: 'hate_speech' },
    created_at: STABLE_DATES.threeDaysAgo,
    updated_at: STABLE_DATES.threeDaysAgo,
    primaryContentType: 'hate_speech'
  },
  {
    id: 'mock-content-004' as UUID,
    user_id: STABLE_USER_ID,
    platform: 'tiktok',
    platform_video_id: 'tiktok_101',
    url: 'https://tiktok.com/video/101',
    title: 'TikTok misinformation video',
    description: 'TikTok video spreading false information',
    detection_status: 'completed',
    confidence_score: 0.65,
    risk_level: 'medium',
    view_count: 5432,
    captions: 'TikTok video spreading false information',
    posted_at: STABLE_DATES.fourDaysAgo,
    duration_seconds: 15,
    resolution: { width: 1080, height: 1920 },
    thumbnail_path: '/thumbnails/tiktok_101.jpg',
    s3_path: '/videos/tiktok_101.mp4',
    metadata: { flagged_reason: 'misinformation' },
    created_at: STABLE_DATES.fourDaysAgo,
    updated_at: STABLE_DATES.fourDaysAgo,
    primaryContentType: 'misinformation',
    userFeedback: 'correct'
  },
  {
    id: 'mock-content-005' as UUID,
    user_id: STABLE_USER_ID,
    platform: 'youtube',
    platform_video_id: 'youtube_202',
    url: 'https://youtube.com/watch?v=202',
    title: 'YouTube spam content',
    description: 'YouTube video flagged as spam content',
    detection_status: 'pending',
    confidence_score: 0.88,
    risk_level: 'low',
    view_count: 892,
    captions: 'YouTube video flagged as spam content',
    posted_at: STABLE_DATES.fiveDaysAgo,
    duration_seconds: 120,
    resolution: { width: 1920, height: 1080 },
    thumbnail_path: '/thumbnails/youtube_202.jpg',
    s3_path: '/videos/youtube_202.mp4',
    metadata: { flagged_reason: 'spam' },
    created_at: STABLE_DATES.fiveDaysAgo,
    updated_at: STABLE_DATES.fiveDaysAgo,
    primaryContentType: 'spam'
  }
];

const mockAnalytics: AnalyticsData = {
  user_id: STABLE_USER_ID,
  metrics: {
    user_id: STABLE_USER_ID,
    total_videos: 1250,
    flagged_videos: 85,
    high_risk_videos: 25,
    pending_reviews: 5,
    accuracy_rate: 0.92,
    trust_score: 0.78,
    time_range: '30d',
    platform_breakdown: {
      twitter: 45,
      instagram: 25,
      facebook: 10,
      tiktok: 5,
      youtube: 0
    },
    risk_breakdown: {
      low: 800,
      medium: 365,
      high: 60,
      critical: 25
    },
    content_type_breakdown: {
      inappropriate: 35,
      spam: 25,
      hate_speech: 15,
      misinformation: 10,
      violence: 0,
      adult_content: 0,
      harassment: 0,
      self_harm: 0,
      terrorism: 0,
      child_safety: 0
    }
  },
  analytics: {
    period_start: STABLE_DATES.thirtyDaysAgo,
    period_end: STABLE_DATES.today,
    engagement_data: [
      { 
        date: STABLE_DATES.sixDaysAgo, 
        videos_analyzed: 12, 
        flagged_count: 2,
        platforms: { twitter: 8, instagram: 3, facebook: 1, tiktok: 0, youtube: 0 },
        risk_levels: { low: 8, medium: 3, high: 1, critical: 0 }
      },
      { 
        date: STABLE_DATES.fiveDaysAgo, 
        videos_analyzed: 8, 
        flagged_count: 1,
        platforms: { twitter: 5, instagram: 2, facebook: 1, tiktok: 0, youtube: 0 },
        risk_levels: { low: 6, medium: 2, high: 0, critical: 0 }
      },
      { 
        date: STABLE_DATES.fourDaysAgo, 
        videos_analyzed: 15, 
        flagged_count: 3,
        platforms: { twitter: 10, instagram: 3, facebook: 2, tiktok: 0, youtube: 0 },
        risk_levels: { low: 10, medium: 4, high: 1, critical: 0 }
      },
      { 
        date: STABLE_DATES.threeDaysAgo, 
        videos_analyzed: 20, 
        flagged_count: 4,
        platforms: { twitter: 12, instagram: 5, facebook: 3, tiktok: 0, youtube: 0 },
        risk_levels: { low: 14, medium: 4, high: 2, critical: 0 }
      },
      { 
        date: STABLE_DATES.twoDaysAgo, 
        videos_analyzed: 18, 
        flagged_count: 3,
        platforms: { twitter: 11, instagram: 4, facebook: 3, tiktok: 0, youtube: 0 },
        risk_levels: { low: 13, medium: 3, high: 2, critical: 0 }
      },
      { 
        date: STABLE_DATES.yesterday, 
        videos_analyzed: 22, 
        flagged_count: 5,
        platforms: { twitter: 14, instagram: 5, facebook: 3, tiktok: 0, youtube: 0 },
        risk_levels: { low: 15, medium: 4, high: 3, critical: 0 }
      },
      { 
        date: STABLE_DATES.today, 
        videos_analyzed: 16, 
        flagged_count: 2,
        platforms: { twitter: 10, instagram: 4, facebook: 2, tiktok: 0, youtube: 0 },
        risk_levels: { low: 12, medium: 3, high: 1, critical: 0 }
      }
    ],
    trends: {
      content_types: [
        { type: 'inappropriate', count: 35, change_percent: 12.5 },
        { type: 'spam', count: 25, change_percent: -5.2 },
        { type: 'hate_speech', count: 15, change_percent: 8.1 },
        { type: 'misinformation', count: 10, change_percent: 15.3 },
        { type: 'violence', count: 0, change_percent: 0 },
        { type: 'adult_content', count: 0, change_percent: 0 },
        { type: 'harassment', count: 0, change_percent: 0 },
        { type: 'self_harm', count: 0, change_percent: 0 },
        { type: 'terrorism', count: 0, change_percent: 0 },
        { type: 'child_safety', count: 0, change_percent: 0 }
      ],
      platforms: [
        { platform: 'twitter', count: 45, change_percent: 10.2 },
        { platform: 'instagram', count: 25, change_percent: 5.8 },
        { platform: 'facebook', count: 10, change_percent: -2.1 },
        { platform: 'tiktok', count: 5, change_percent: 25.0 },
        { platform: 'youtube', count: 0, change_percent: 0 }
      ]
    }
  }
};

// API endpoint patterns and their mock responses
const mockResponses: Record<string, (url: string, options?: RequestInit) => Promise<ApiResponse<any>>> = {
  // Content endpoints - both legacy and new patterns
  'GET /api/content/flagged': async (url) => {
    const urlObj = new URL(url);
    const page = parseInt(urlObj.searchParams.get('page') || '1');
    
    // Aggressive protection against infinite pagination
    if (page > 10) {
      console.error(`🎭 BLOCKING: Request for page ${page} blocked. Possible infinite pagination detected.`);
      return {
        success: false,
        data: [], // Always provide data field, even for errors
        error: {
          code: 'MAX_PAGES_EXCEEDED',
          message: 'Maximum page limit exceeded. Possible infinite pagination detected.',
        },
        timestamp: STABLE_TIMESTAMP,
        user_id: STABLE_USER_ID,
        pagination: {
          page,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    // Log warning for pages beyond page 1 to help debug infinite pagination
    if (page > 1) {
      console.warn(`🎭 WARNING: Request for page ${page} - no more data available. This might indicate infinite pagination.`);
    }
    
    // Only return data for page 1, empty array for others to prevent infinite pagination
    const data = page === 1 ? mockFlaggedContent : [];
    const totalPages = 1; // We only have one page of data
    
    // Add delay that increases with page number to throttle rapid requests
    await new Promise(resolve => setTimeout(resolve, Math.min(page * 50, 500)));
    
    return {
      success: true,
      data: data || [], // Ensure data is always an array
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID,
      pagination: {
        page,
        limit: 10,
        total: page === 1 ? mockFlaggedContent.length : 0,
        totalPages,
        hasNext: false, // Never indicate there are more pages
        hasPrev: page > 1
      }
    };
  },

  'GET /api/content/analytics': async () => ({
    success: true,
    data: mockAnalytics,
    timestamp: STABLE_TIMESTAMP,
    user_id: STABLE_USER_ID
  }),

  'POST /api/content/feedback': async (_url, _options) => {
    // Simulate feedback submission
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { id: generateMockUUID(), submitted_at: STABLE_TIMESTAMP },
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID
    };
  },

  'PUT /api/content/action': async (_url, _options) => {
    // Simulate content action (dismiss, confirm, etc.)
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: { updated_at: STABLE_TIMESTAMP },
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID
    };
  },

  // User profile endpoints
  'GET /api/user/profile': async () => ({
    success: true,
    data: {
      id: STABLE_USER_ID,
      email: 'user@example.com',
      display_name: 'Test User',
      is_active: true,
      locale: 'en',
      metadata: {},
      created_at: STABLE_DATES.thirtyDaysAgo,
      updated_at: STABLE_DATES.yesterday,
      user_accounts: [],
      devices: [],
      privacy_consents: [],
      real_time_alerts: []
    },
    timestamp: STABLE_TIMESTAMP,
    user_id: STABLE_USER_ID
  }),

  'PUT /api/user/profile': async (_url, _options) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      success: true,
      data: { updated_at: STABLE_TIMESTAMP },
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID
    };
  },

  // Settings endpoints
  'GET /api/user/settings': async () => ({
    success: true,
    data: {
      notifications_enabled: true,
      email_alerts: false,
      dark_mode: false,
      confidence_threshold: 0.7,
      auto_dismiss_threshold: 0.9
    },
    timestamp: STABLE_TIMESTAMP,
    user_id: STABLE_USER_ID
  }),

  'PUT /api/user/settings': async (_url, _options) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: { updated_at: STABLE_TIMESTAMP },
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID
    };
  },

  // User-scoped content endpoints (new patterns used by contentService)
  'GET /users/videos/flagged': async (url) => {
    const urlObj = new URL(url);
    const page = parseInt(urlObj.searchParams.get('page') || '1');
    
    // Aggressive protection against infinite pagination
    if (page > 10) {
      console.error(`🎭 BLOCKING: Request for page ${page} blocked. Possible infinite pagination detected.`);
      return {
        success: false,
        data: [], // Always provide data field, even for errors
        error: {
          code: 'MAX_PAGES_EXCEEDED',
          message: 'Maximum page limit exceeded. Possible infinite pagination detected.',
        },
        timestamp: STABLE_TIMESTAMP,
        user_id: STABLE_USER_ID,
        pagination: {
          page,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    // Log warning for pages beyond page 1 to help debug infinite pagination
    if (page > 1) {
      console.warn(`🎭 WARNING: Request for page ${page} - no more data available. This might indicate infinite pagination.`);
    }
    
    // Only return data for page 1, empty array for others to prevent infinite pagination
    const data = page === 1 ? mockFlaggedContent : [];
    const totalPages = 1; // We only have one page of data
    
    // Add delay that increases with page number to throttle rapid requests
    await new Promise(resolve => setTimeout(resolve, Math.min(page * 50, 500)));
    
    return {
      success: true,
      data: data || [], // Ensure data is always an array
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID,
      pagination: {
        page,
        limit: 10,
        total: page === 1 ? mockFlaggedContent.length : 0,
        totalPages,
        hasNext: false, // Never indicate there are more pages
        hasPrev: page > 1
      }
    };
  },

  'GET /users/analytics': async () => ({
    success: true,
    data: mockAnalytics,
    timestamp: STABLE_TIMESTAMP,
    user_id: STABLE_USER_ID
  }),

  'POST /users/feedback': async (_url, _options) => {
    // Simulate feedback submission
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { id: generateMockUUID(), created_at: STABLE_TIMESTAMP },
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID
    };
  },

  'GET /users/dashboard/summary': async () => ({
    success: true,
    data: {
      analytics: mockAnalytics,
      recentFlags: mockFlaggedContent.slice(0, 3), // Show 3 most recent
      pendingReviews: 5, // Match the analytics pending_reviews value
      notifications: [],
      exposureSummary: undefined
    },
    timestamp: STABLE_TIMESTAMP,
    user_id: STABLE_USER_ID
  })
};

/**
 * Mock API Interceptor Class
 * Intercepts fetch requests and returns mock data when enabled
 */
export class MockApiInterceptor {
  private static instance: MockApiInterceptor;
  private originalFetch: typeof fetch;
  private isIntercepting = false;
  private requestCounts: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();

  private constructor() {
    this.originalFetch = global.fetch;
  }

  static getInstance(): MockApiInterceptor {
    if (!MockApiInterceptor.instance) {
      MockApiInterceptor.instance = new MockApiInterceptor();
    }
    return MockApiInterceptor.instance;
  }

  /**
   * Start intercepting API calls
   */
  start(): void {
    if (this.isIntercepting || !CONFIG.DEV.MOCK_API) {
      return;
    }

    this.isIntercepting = true;
    global.fetch = this.mockFetch.bind(this);
    
    if (CONFIG.DEV.ENABLE_LOGS) {
      console.log('🎭 Mock API Interceptor started');
    }
  }

  /**
   * Stop intercepting API calls
   */
  stop(): void {
    if (!this.isIntercepting) {
      return;
    }

    this.isIntercepting = false;
    global.fetch = this.originalFetch;
    
    if (CONFIG.DEV.ENABLE_LOGS) {
      console.log('🎭 Mock API Interceptor stopped');
      console.log('🎭 Final request counts:', Object.fromEntries(this.requestCounts));
    }
    
    // Clear tracking data
    this.requestCounts.clear();
    this.lastRequestTime.clear();
  }

  /**
   * Mock fetch implementation
   */
  private async mockFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = input.toString();
    const method = init?.method || 'GET';
    const endpoint = this.extractEndpoint(url, method);

    // Track request frequency
    const currentTime = Date.now();
    const lastTime = this.lastRequestTime.get(endpoint) || 0;
    const timeDiff = currentTime - lastTime;
    
    // Increment request count
    const count = (this.requestCounts.get(endpoint) || 0) + 1;
    this.requestCounts.set(endpoint, count);
    this.lastRequestTime.set(endpoint, currentTime);
    
    // Log warning for frequent requests (less than 100ms apart)
    if (timeDiff < 100 && count > 5) {
      console.warn(`🎭 FREQUENT REQUESTS: ${endpoint} called ${count} times, last call ${timeDiff}ms ago`);
    }

    if (CONFIG.DEV.ENABLE_LOGS) {
      console.log(`🎭 Intercepting ${method} ${url} -> ${endpoint} (count: ${count})`);
      if (count % 10 === 0) {
        console.log(`🎭 Request frequency summary:`, Object.fromEntries(this.requestCounts));
      }
    }

    // Check if we have a mock response for this endpoint
    const mockHandler = mockResponses[endpoint];
    if (mockHandler) {
      try {
        const mockResponse = await mockHandler(url, init);
        
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('🎭 Mock API error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: {
            code: 'MOCK_ERROR',
            message: 'Mock API error',
            details: error
          }
        }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // If no mock response found, return a generic success response
    if (CONFIG.DEV.ENABLE_LOGS) {
      console.warn(`🎭 No mock response for ${endpoint}, returning generic success`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: [], // Always provide data as an array for list endpoints
      message: 'Mock response',
      timestamp: STABLE_TIMESTAMP,
      user_id: STABLE_USER_ID,
      // Add pagination for list endpoints
      ...(endpoint.includes('flagged') && {
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Extract endpoint pattern from URL
   */
  private extractEndpoint(url: string, method: string): string {
    try {
      const urlObj = new URL(url);
      // Use pathname (which excludes query parameters and hash)
      const path = urlObj.pathname;
      return `${method.toUpperCase()} ${path}`;
    } catch {
      // If URL parsing fails, try to extract path from string
      const pathMatch = url.match(/https?:\/\/[^\/]+(\/.*)/) || url.match(/(\/.+)/);
      let path = pathMatch ? pathMatch[1] : url;
      
      // Remove query parameters and hash - ensure path is defined
      if (path) {
        const pathWithoutQuery = path.split('?')[0];
        path = pathWithoutQuery ? pathWithoutQuery.split('#')[0] : path;
      }
      
      return `${method.toUpperCase()} ${path || '/'}`;
    }
  }
}

/**
 * Initialize mock API interceptor if enabled
 */
export const initializeMockApi = (): void => {
  if (CONFIG.DEV.MOCK_API) {
    const interceptor = MockApiInterceptor.getInstance();
    interceptor.start();
  }
};

/**
 * Stop mock API interceptor
 */
export const stopMockApi = (): void => {
  const interceptor = MockApiInterceptor.getInstance();
  interceptor.stop();
};