/**
 * Authentication Context
 * Manages user authentication state and provides user context throughout the app
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { flexibleAuthService, type AuthResponse, type AuthUser } from '../services/flexibleAuthService';
import type { User, UUID } from '@/types/database';

// Auth State Interface
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  isNewSignup: boolean; // Track if user just completed signup
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_LOADING'; payload: boolean }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string; isNewSignup?: boolean } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_NEW_SIGNUP' };

// Initial State
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,
  isNewSignup: false,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        error: null,
        isNewSignup: action.payload.isNewSignup || false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'CLEAR_NEW_SIGNUP':
      return {
        ...state,
        isNewSignup: false,
      };
    default:
      return state;
  }
}

// Context Interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'facebook' | 'twitter', token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
  clearNewSignup: () => void;
  getUserId: () => UUID | null;
  getAuthHeaders: () => Record<string, string>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Storage Keys
  const ACCESS_TOKEN_KEY = 'auth_token';
  const REFRESH_TOKEN_KEY = 'auth_token_refresh';
  const USER_DATA_KEY = 'user_data';
  const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
  const REFRESH_EXPIRY_KEY = 'auth_refresh_expiry';

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      const [accessToken, refreshToken, userData, tokenExpiry, refreshExpiry] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
        AsyncStorage.getItem(TOKEN_EXPIRY_KEY),
        AsyncStorage.getItem(REFRESH_EXPIRY_KEY),
      ]);

      if (accessToken && refreshToken && userData && tokenExpiry && refreshExpiry) {
        const user = JSON.parse(userData) as User;
        
        // Check if tokens are expired
        const now = new Date().getTime();
        const tokenExpiryTime = new Date(tokenExpiry).getTime();
        const refreshExpiryTime = new Date(refreshExpiry).getTime();
        const isTokenValid = now < tokenExpiryTime;
        const isRefreshValid = now < refreshExpiryTime;
        
        if (isTokenValid) {
          // Token is still valid, restore session
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              accessToken,
              refreshToken,
              isNewSignup: false, // This is a session restore, not a new signup
            },
          });
          // Ensure the flexible auth service uses the restored token for future requests
          try {
            flexibleAuthService.setAuthToken(accessToken);
          } catch (e) {
            // Non-fatal
            console.warn('Failed to set auth token on service during init', e);
          }
          return;
        } else if (isRefreshValid) {
          // Access token expired, but refresh token is valid - try to refresh
          try {
            const refreshResponse = await flexibleAuthService.refreshToken(refreshToken);
            if (refreshResponse.success && refreshResponse.user && refreshResponse.token) {
              // Store new tokens
              await Promise.all([
                AsyncStorage.setItem(ACCESS_TOKEN_KEY, refreshResponse.token),
                AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshResponse.refreshToken || ''),
                AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(refreshResponse.user)),
                AsyncStorage.setItem(TOKEN_EXPIRY_KEY, refreshResponse.tokenExpiresAt || ''),
                AsyncStorage.setItem(REFRESH_EXPIRY_KEY, refreshResponse.refreshTokenExpiresAt || ''),
              ]);
              
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                  user: refreshResponse.user,
                  accessToken: refreshResponse.token,
                  refreshToken: refreshResponse.refreshToken || '',
                  isNewSignup: false, // This is a token refresh, not a new signup
                },
              });
                // Ensure service has updated token
                try {
                  flexibleAuthService.setAuthToken(refreshResponse.token);
                } catch (e) {
                  console.warn('Failed to set auth token on service after refresh', e);
                }
              return;
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }
        
        // Both tokens are expired or refresh failed, clear storage and require login
        console.log('Tokens expired, requiring re-authentication');
      }

      // If no valid auth found, clear storage
      await clearAuthStorage();
      dispatch({ type: 'AUTH_LOADING', payload: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearAuthStorage();
      dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      // Use mock authentication service instead of API call
      const response = await flexibleAuthService.login(email, password);

      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }

      if (response.user && response.token) {
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.token),
          AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user)),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken || ''),
          AsyncStorage.setItem(TOKEN_EXPIRY_KEY, response.tokenExpiresAt || ''),
          AsyncStorage.setItem(REFRESH_EXPIRY_KEY, response.refreshTokenExpiresAt || ''),
        ]);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            accessToken: response.token,
            refreshToken: response.refreshToken || '',
            isNewSignup: false, // This is a login, not a new signup
          },
        });
        // Make sure the flexible auth service has the token for subsequent requests
        try {
          flexibleAuthService.setAuthToken(response.token);
        } catch (e) {
          console.warn('Failed to set auth token on service after login', e);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      // Use flexible authentication service for signup
      const response = await flexibleAuthService.signup(email, password, firstName, lastName);

      if (!response.success) {
        throw new Error(response.error || 'Signup failed');
      }

      if (response.user && response.token) {
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.token),
          AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user)),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken || ''),
          AsyncStorage.setItem(TOKEN_EXPIRY_KEY, response.tokenExpiresAt || ''),
          AsyncStorage.setItem(REFRESH_EXPIRY_KEY, response.refreshTokenExpiresAt || ''),
        ]);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            accessToken: response.token,
            refreshToken: response.refreshToken || '',
            isNewSignup: true, // This is a signup, so it's a new user
          },
        });
        try {
          flexibleAuthService.setAuthToken(response.token);
        } catch (e) {
          console.warn('Failed to set auth token on service after signup', e);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'facebook' | 'twitter', _token: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      // Use flexible OAuth authentication service
      const response = await flexibleAuthService.oauthLogin(provider, _token);

      if (!response.success) {
        throw new Error(response.error || 'OAuth login failed');
      }

      if (response.user && response.token) {
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.token),
          AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user)),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken || ''),
          AsyncStorage.setItem(TOKEN_EXPIRY_KEY, response.tokenExpiresAt || ''),
          AsyncStorage.setItem(REFRESH_EXPIRY_KEY, response.refreshTokenExpiresAt || ''),
        ]);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            accessToken: response.token,
            refreshToken: response.refreshToken || '',
            isNewSignup: response.isNewUser || false, // Use OAuth response to determine if new user
          },
        });
        try {
          flexibleAuthService.setAuthToken(response.token);
        } catch (e) {
          console.warn('Failed to set auth token on service after oauth login', e);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to notify backend about logout, ignore errors
      try {
        await flexibleAuthService.logout(state.accessToken || '');
      } catch (e) {
        // Non-fatal - proceed to clear local state
        console.warn('Backend logout failed (continuing to clear local state)', e);
      }

      // Clear all stored authentication data
      await clearAuthStorage();
      flexibleAuthService.setAuthToken('');
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still try to clear state even if storage clear fails
      flexibleAuthService.setAuthToken('');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshAuth = async (refreshToken?: string): Promise<boolean> => {
    try {
      const token = refreshToken || state.refreshToken;
      if (!token) return false;

      // Use flexible auth service to refresh token
      const response = await flexibleAuthService.refreshToken(token);

      if (!response.success || !response.user || !response.token) {
        throw new Error(response.error || 'Token refresh failed');
      }

      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      if (response.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.token,
          refreshToken: response.refreshToken || token,
          isNewSignup: false, // This is a token refresh, not a new signup
        },
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuthStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
      return false;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!state.user) {
        throw new Error('No user to update');
      }

      const updatedUser: User = {
        ...state.user,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      // Update stored user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      
      dispatch({ type: 'UPDATE_USER', payload: updates });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const clearNewSignup = () => {
    dispatch({ type: 'CLEAR_NEW_SIGNUP' });
  };

  const getUserId = (): UUID | null => {
    return state.user?.id || null;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (state.accessToken) {
      headers['Authorization'] = `Bearer ${state.accessToken}`;
    }

    return headers;
  };

  // Helper functions
  const clearAuthStorage = async () => {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_DATA_KEY),
      AsyncStorage.removeItem(TOKEN_EXPIRY_KEY),
      AsyncStorage.removeItem(REFRESH_EXPIRY_KEY),
    ]);
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    loginWithOAuth,
    logout,
    refreshAuth: () => refreshAuth(),
    updateProfile,
    clearError,
    clearNewSignup,
    getUserId,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for authenticated routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return null; // Or loading component
    }

    if (!isAuthenticated) {
      // Redirect to login or show login screen
      return null;
    }

    return <Component {...props} />;
  };
}