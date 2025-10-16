/**
 * Mock Authentication Data
 * Temporary authentication responses for development
 */

import { User } from '@/types/database';

// Mock user data
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    display_name: 'John Doe',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-12-01T14:30:00Z',
    is_active: true,
    locale: 'en-US',
    metadata: {
      firstName: 'John',
      lastName: 'Doe',
      role: 'individual',
      subscriptionStatus: 'free',
      lastLoginAt: '2023-12-01T14:30:00Z',
    },
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    display_name: 'Jane Smith',
    created_at: '2023-02-20T08:15:00Z',
    updated_at: '2023-11-28T16:45:00Z',
    is_active: true,
    locale: 'en-US',
    metadata: {
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'parent',
      parentalRole: 'mother',
      subscriptionStatus: 'premium',
      oauthProvider: 'google',
      oauthProviderId: 'google-123456',
      lastLoginAt: '2023-11-28T16:45:00Z',
    },
  },
  {
    id: 'user-3',
    email: 'alex.johnson@example.com',
    display_name: 'Alex Johnson',
    created_at: '2023-03-10T12:30:00Z',
    updated_at: '2023-11-30T09:20:00Z',
    is_active: true,
    locale: 'en-US',
    metadata: {
      firstName: 'Alex',
      lastName: 'Johnson',
      role: 'educator',
      subscriptionStatus: 'enterprise',
      lastLoginAt: '2023-11-30T09:20:00Z',
    },
  },
];

// Mock authentication responses
export interface MockAuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  error?: string;
  isNewUser?: boolean; // Track if this is a new user registration
}

export const mockAuthAPI = {
  // Mock login function
  login: async (email: string, password: string): Promise<MockAuthResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return {
        success: false,
        error: 'No account found with this email address. Please check your email or sign up for a new account.',
      };
    }

    // For mock purposes, accept any password for existing users
    // In a real app, you'd verify the password hash
    if (password.length < 6) {
      return {
        success: false,
        error: 'Incorrect password. Please check your password and try again.',
      };
    }

    // Set token expiration times
    const now = new Date();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      success: true,
      user: {
        ...user,
        metadata: {
          ...user.metadata,
          lastLoginAt: new Date().toISOString(),
        },
      },
      token: `mock-jwt-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      tokenExpiresAt: tokenExpiry.toISOString(),
      refreshTokenExpiresAt: refreshExpiry.toISOString(),
      isNewUser: false, // This is a login
    };
  },

  // Mock signup function
  signup: async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<MockAuthResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please try logging in instead, or use a different email address.',
      };
    }

    // Validate input
    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long for security reasons.',
      };
    }

    if (!firstName.trim() || !lastName.trim()) {
      return {
        success: false,
        error: 'Both first name and last name are required to create your account.',
      };
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return {
        success: false,
        error: 'First name and last name must each be at least 2 characters long.',
      };
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      display_name: `${firstName.trim()} ${lastName.trim()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      locale: 'en-US',
      metadata: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'individual',
        subscriptionStatus: 'free',
        lastLoginAt: new Date().toISOString(),
      },
    };

    // Add to mock users (in real app, this would be saved to database)
    mockUsers.push(newUser);

    // Set token expiration times
    const now = new Date();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      success: true,
      user: newUser,
      token: `mock-jwt-token-${newUser.id}`,
      refreshToken: `mock-refresh-token-${newUser.id}`,
      tokenExpiresAt: tokenExpiry.toISOString(),
      refreshTokenExpiresAt: refreshExpiry.toISOString(),
      isNewUser: true, // This is a new signup
    };
  },

  // Mock OAuth login function
  oauthLogin: async (provider: 'google' | 'facebook' | 'twitter'): Promise<MockAuthResponse> => {
    // Simulate OAuth flow delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For mock purposes, return a predefined user based on provider
    let mockUser: User;
    let isNewUser = false;
    
    switch (provider) {
      case 'google':
        // Google uses an existing user (login scenario)
        mockUser = mockUsers.find(u => u.metadata.oauthProvider === 'google') || mockUsers[1]!;
        isNewUser = false;
        break;
      case 'facebook':
        // Facebook creates a new user (signup scenario)
        mockUser = {
          id: 'user-facebook',
          email: 'facebook.user@example.com',
          display_name: 'Facebook User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          locale: 'en-US',
          metadata: {
            firstName: 'Facebook',
            lastName: 'User',
            role: 'individual',
            subscriptionStatus: 'free',
            oauthProvider: 'facebook',
            oauthProviderId: 'facebook-789012',
            lastLoginAt: new Date().toISOString(),
          },
        };
        isNewUser = true;
        break;
      case 'twitter':
        // Twitter creates a new user (signup scenario)
        mockUser = {
          id: 'user-twitter',
          email: 'twitter.user@example.com',
          display_name: 'Twitter User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          locale: 'en-US',
          metadata: {
            firstName: 'Twitter',
            lastName: 'User',
            role: 'individual',
            subscriptionStatus: 'free',
            oauthProvider: 'twitter',
            oauthProviderId: 'twitter-345678',
            lastLoginAt: new Date().toISOString(),
          },
        };
        isNewUser = true;
        break;
      default:
        return {
          success: false,
          error: 'Unsupported OAuth provider.',
        };
    }

    // Set token expiration times
    const now = new Date();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      success: true,
      user: mockUser,
      token: `mock-jwt-token-${mockUser.id}`,
      refreshToken: `mock-refresh-token-${mockUser.id}`,
      tokenExpiresAt: tokenExpiry.toISOString(),
      refreshTokenExpiresAt: refreshExpiry.toISOString(),
      isNewUser,
    };
  },

  // Mock token refresh function
  refreshToken: async (refreshToken: string): Promise<MockAuthResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract user ID from refresh token (mock logic)
    const userId = refreshToken.replace('mock-refresh-token-', '');
    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
      return {
        success: false,
        error: 'Invalid refresh token.',
      };
    }

    // Set token expiration times for refreshed tokens
    const now = new Date();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      success: true,
      user,
      token: `mock-jwt-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      tokenExpiresAt: tokenExpiry.toISOString(),
      refreshTokenExpiresAt: refreshExpiry.toISOString(),
    };
  },

  // Validate if token is still valid (not expired)
  validateToken: async (tokenExpiresAt: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const now = new Date();
    const expiryDate = new Date(tokenExpiresAt);
    
    return now < expiryDate;
  },

  // Helper function to simulate expired tokens for testing
  // In a real app, you wouldn't need this
  simulateExpiredToken: () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    return pastDate.toISOString();
  },
};

// Mock credentials for testing
export const testCredentials = {
  validUser: {
    email: 'john.doe@example.com',
    password: 'password123',
  },
  parentUser: {
    email: 'jane.smith@example.com',
    password: 'password123',
  },
  educatorUser: {
    email: 'alex.johnson@example.com',
    password: 'password123',
  },
};