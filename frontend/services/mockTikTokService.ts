/**
 * Mock TikTok API Service
 * Simulates TikTok OAuth flow and feed data retrieval
 */

export interface TikTokProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  video_count: number;
  verified: boolean;
}

export interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  cover_image_url: string;
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  hashtags: string[];
  created_at: string;
  creator: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface TikTokAuthResponse {
  success: boolean;
  error?: string;
  authUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  profile?: TikTokProfile | undefined;
}

export interface TikTokFeedResponse {
  success: boolean;
  error?: string;
  videos?: TikTokVideo[];
  nextCursor?: string | undefined;
}

class MockTikTokService {
  private readonly CLIENT_ID = 'mock_tiktok_client_id';
  private readonly REDIRECT_URI = 'anchor://tiktok-callback';

  // Mock user profiles
  private mockProfiles: TikTokProfile[] = [
    {
      id: 'mock_user_1',
      username: 'john_creator',
      display_name: 'John Creator',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      follower_count: 15420,
      following_count: 532,
      video_count: 89,
      verified: false,
    },
    {
      id: 'mock_user_2',
      username: 'sarah_videos',
      display_name: 'Sarah Videos',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      follower_count: 98750,
      following_count: 234,
      video_count: 156,
      verified: true,
    },
  ];

  // Mock video feed data
  private mockVideos: TikTokVideo[] = [
    {
      id: 'video_1',
      title: 'Amazing cooking hack!',
      description: 'Try this amazing cooking hack that will change your life! #cooking #lifehack #amazing',
      video_url: 'https://example.com/video1.mp4',
      cover_image_url: 'https://picsum.photos/400/600?random=1',
      duration: 15,
      view_count: 125000,
      like_count: 8900,
      comment_count: 567,
      share_count: 234,
      hashtags: ['cooking', 'lifehack', 'amazing'],
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      creator: {
        username: 'foodie_chef',
        display_name: 'Foodie Chef',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
      },
    },
    {
      id: 'video_2',
      title: 'Dance challenge',
      description: 'Join the latest dance challenge! 💃 #dance #challenge #trending #fyp',
      video_url: 'https://example.com/video2.mp4',
      cover_image_url: 'https://picsum.photos/400/600?random=2',
      duration: 30,
      view_count: 89000,
      like_count: 12400,
      comment_count: 890,
      share_count: 456,
      hashtags: ['dance', 'challenge', 'trending', 'fyp'],
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      creator: {
        username: 'dance_master',
        display_name: 'Dance Master',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dancer',
      },
    },
    {
      id: 'video_3',
      title: 'Tech tips you need to know',
      description: 'Essential tech tips for productivity! Save this for later 📱 #tech #productivity #tips',
      video_url: 'https://example.com/video3.mp4',
      cover_image_url: 'https://picsum.photos/400/600?random=3',
      duration: 45,
      view_count: 67000,
      like_count: 5600,
      comment_count: 234,
      share_count: 189,
      hashtags: ['tech', 'productivity', 'tips'],
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      creator: {
        username: 'tech_guru',
        display_name: 'Tech Guru',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
      },
    },
    {
      id: 'video_4',
      title: 'Cute pet compilation',
      description: 'The cutest pets on the internet! 🐱🐶 #pets #cute #animals #wholesome',
      video_url: 'https://example.com/video4.mp4',
      cover_image_url: 'https://picsum.photos/400/600?random=4',
      duration: 60,
      view_count: 234000,
      like_count: 18900,
      comment_count: 1200,
      share_count: 567,
      hashtags: ['pets', 'cute', 'animals', 'wholesome'],
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      creator: {
        username: 'pet_lover',
        display_name: 'Pet Lover',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pets',
      },
    },
    {
      id: 'video_5',
      title: 'Travel vlog: Hidden gems',
      description: 'Discover hidden travel destinations! Where should I go next? ✈️ #travel #adventure #explore',
      video_url: 'https://example.com/video5.mp4',
      cover_image_url: 'https://picsum.photos/400/600?random=5',
      duration: 90,
      view_count: 156000,
      like_count: 11200,
      comment_count: 678,
      share_count: 345,
      hashtags: ['travel', 'adventure', 'explore'],
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      creator: {
        username: 'travel_wanderer',
        display_name: 'Travel Wanderer',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel',
      },
    },
  ];

  /**
   * Initiates TikTok OAuth flow
   * Returns authorization URL for the user to visit
   */
  async initiateAuth(): Promise<TikTokAuthResponse> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock authorization URL
      const state = Math.random().toString(36).substring(7);
      const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${this.CLIENT_ID}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&response_type=code&scope=user.info.basic,video.list&state=${state}`;

      return {
        success: true,
        authUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to initiate TikTok authorization',
      };
    }
  }

  /**
   * Exchanges authorization code for access token
   * Simulates the callback handling after user authorizes
   */
  async exchangeCodeForToken(code: string): Promise<TikTokAuthResponse> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate authorization failure for certain codes
      if (code === 'error_code' || code === 'denied') {
        return {
          success: false,
          error: 'Authorization was denied or failed',
        };
      }

      // Generate mock tokens and profile
      const profile = this.mockProfiles[Math.floor(Math.random() * this.mockProfiles.length)];
      
      return {
        success: true,
        accessToken: `tiktok_access_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        refreshToken: `tiktok_refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        expiresIn: 7200, // 2 hours
        profile,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to exchange code for access token',
      };
    }
  }

  /**
   * Gets user's TikTok profile information
   */
  async getUserProfile(accessToken: string): Promise<TikTokAuthResponse> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate invalid token
      if (accessToken.includes('invalid') || accessToken.includes('expired')) {
        return {
          success: false,
          error: 'Invalid or expired access token',
        };
      }

      const profile = this.mockProfiles[Math.floor(Math.random() * this.mockProfiles.length)];

      return {
        success: true,
        profile,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user profile',
      };
    }
  }

  /**
   * Gets user's TikTok feed/watched videos
   */
  async getUserFeed(accessToken: string, cursor?: string): Promise<TikTokFeedResponse> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Simulate invalid token
      if (accessToken.includes('invalid') || accessToken.includes('expired')) {
        return {
          success: false,
          error: 'Invalid or expired access token',
        };
      }

      // Simulate pagination
      const pageSize = 3;
      const startIndex = cursor ? parseInt(cursor) : 0;
      const endIndex = startIndex + pageSize;
      
      // Use proper pagination instead of random shuffling to prevent duplicates
      const videos = this.mockVideos.slice(startIndex, endIndex);

      return {
        success: true,
        videos,
        nextCursor: endIndex < this.mockVideos.length ? endIndex.toString() : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user feed',
      };
    }
  }

  /**
   * Refreshes expired access token
   */
  async refreshToken(refreshToken: string): Promise<TikTokAuthResponse> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate invalid refresh token
      if (refreshToken.includes('invalid') || refreshToken.includes('expired')) {
        return {
          success: false,
          error: 'Invalid or expired refresh token',
        };
      }

      return {
        success: true,
        accessToken: `tiktok_access_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        refreshToken: `tiktok_refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        expiresIn: 7200,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to refresh access token',
      };
    }
  }

  /**
   * Disconnects TikTok account
   */
  async disconnectAccount(_accessToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to disconnect TikTok account',
      };
    }
  }
}

export const mockTikTokService = new MockTikTokService();