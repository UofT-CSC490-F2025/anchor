/**
 * Flexible Authentication Service
 * Uses the flexible API service for authentication with real/mock switching
 */

import { FlexibleApiService } from './flexibleApiService';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  locale: string;
  metadata: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  isNewUser?: boolean;
  error?: string;
}

export class FlexibleAuthService {
  private apiService: FlexibleApiService;

  constructor() {
    this.apiService = new FlexibleApiService();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.apiService.request<AuthResponse>('auth.login', 'POST', {
      email,
      password,
    });

    // If login succeeded and returned a token, set it on the underlying API service
    if (res && res.token) {
      this.apiService.setAuthToken(res.token);
    }

    return res;
  }

  async signup(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
    const res = await this.apiService.request<AuthResponse>('auth.register', 'POST', {
      email,
      password,
      firstName,
      lastName,
    });

    if (res && res.token) {
      this.apiService.setAuthToken(res.token);
    }

    return res;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const res = await this.apiService.request<AuthResponse>('auth.refreshToken', 'POST', {
      refreshToken,
    });

    // Update token on apiService if provided
    if (res && res.token) {
      this.apiService.setAuthToken(res.token);
    }

    return res;
  }

  async logout(token: string): Promise<{ success: boolean; message?: string }> {
    this.apiService.setAuthToken(token);
    return this.apiService.request<{ success: boolean; message?: string }>('auth.logout', 'POST');
  }

  async validateToken(token: string): Promise<AuthResponse> {
    this.apiService.setAuthToken(token);
    const res = await this.apiService.request<AuthResponse>('auth.validate', 'GET');
    if (res && res.token) {
      this.apiService.setAuthToken(res.token);
    }
    return res;
  }

  async oauthLogin(provider: string, accessToken: string): Promise<AuthResponse> {
    const res = await this.apiService.request<AuthResponse>('auth.oauth', 'POST', {
      provider,
      accessToken,
    });

    if (res && res.token) {
      this.apiService.setAuthToken(res.token);
    }

    return res;
  }

  // Expose method to manually set auth token on the underlying API service
  setAuthToken(token?: string) {
    this.apiService.setAuthToken(token || '');
  }
}

// Export singleton instance
export const flexibleAuthService = new FlexibleAuthService();

// Export factory function
export function createFlexibleAuthService(): FlexibleAuthService {
  return new FlexibleAuthService();
}