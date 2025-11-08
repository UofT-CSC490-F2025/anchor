/**
 * URL Validation Utilities
 * Centralized validation for social media URLs
 */

export interface ValidationResult {
  isValid: boolean;
  platform?: 'tiktok' | 'instagram' | 'twitter' | 'facebook';
  error?: string;
}

/**
 * Validates TikTok URLs and returns structured result
 */
export function validateTikTokUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: 'Please enter a URL'
    };
  }

  const cleanUrl = url.trim();
  
  // TikTok URL patterns
  const tiktokPatterns = [
    // Standard video URL
    /^https?:\/\/(?:www\.)?tiktok\.com\/@[\w\.-]+\/video\/\d+/,
    // Mobile share URL
    /^https?:\/\/vm\.tiktok\.com\/[\w\d]+/,
    // Short URL
    /^https?:\/\/(?:www\.)?tiktok\.com\/t\/[\w\d]+/,
    // Direct video URL
    /^https?:\/\/(?:www\.)?tiktok\.com\/v\/\d+/,
    // Alternative mobile format
    /^https?:\/\/m\.tiktok\.com\/@[\w\.-]+\/video\/\d+/,
  ];
  
  const isValidTikTok = tiktokPatterns.some(pattern => pattern.test(cleanUrl));
  
  if (isValidTikTok) {
    return {
      isValid: true,
      platform: 'tiktok'
    };
  }

  // Check if it's a TikTok domain but invalid format
  if (cleanUrl.includes('tiktok.com') || cleanUrl.includes('vm.tiktok.com')) {
    return {
      isValid: false,
      platform: 'tiktok',
      error: 'Invalid TikTok URL format. Please use a direct link to a video or post.'
    };
  }

  return {
    isValid: false,
    error: 'Please enter a valid TikTok URL'
  };
}

/**
 * Get example URLs for a platform
 */
export function getExampleUrls(platform: 'tiktok'): string[] {
  switch (platform) {
    case 'tiktok':
      return [
        'https://www.tiktok.com/@username/video/1234567890',
        'https://vm.tiktok.com/ABC123',
        'https://www.tiktok.com/t/ABC123'
      ];
    default:
      return [];
  }
}

/**
 * Extract platform from URL
 */
export function detectPlatform(url: string): ValidationResult['platform'] | null {
  if (!url) return null;
  
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com')) return 'facebook';
  
  return null;
}

/**
 * Format URL for display (truncate long URLs)
 */
export function formatUrlForDisplay(url: string, maxLength = 50): string {
  if (!url || url.length <= maxLength) return url;
  
  return `${url.substring(0, maxLength - 3)}...`;
}