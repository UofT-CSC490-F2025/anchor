/**
 * Authentication Context
 * Manages user authentication state and provides user context throughout the app
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockAuthAPI } from '@/services/mockAuthService';
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
        const isTokenValid = await mockAuthAPI.validateToken(tokenExpiry);
        const isRefreshValid = await mockAuthAPI.validateToken(refreshExpiry);
        
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
          return;
        } else if (isRefreshValid) {
          // Access token expired, but refresh token is valid - try to refresh
          try {
            const refreshResponse = await mockAuthAPI.refreshToken(refreshToken);
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
      const mockResponse = await mockAuthAPI.login(email, password);

      if (!mockResponse.success) {
        throw new Error(mockResponse.error || 'Login failed');
      }

      if (mockResponse.user && mockResponse.token) {
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, mockResponse.token),
          AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockResponse.user)),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, mockResponse.refreshToken || ''),
          AsyncStorage.setItem(TOKEN_EXPIRY_KEY, mockResponse.tokenExpiresAt || ''),
          AsyncStorage.setItem(REFRESH_EXPIRY_KEY, mockResponse.refreshTokenExpiresAt || ''),
        ]);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: mockResponse.user,
            accessToken: mockResponse.token,
            refreshToken: mockResponse.refreshToken || '',
            isNewSignup: false, // This is a login, not a new signup
          },
        });
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

      // Use mock authentication service for signup
      const mockResponse = await mockAuthAPI.signup(email, password, firstName, lastName);

      if (!mockResponse.success) {
        throw new Error(mockResponse.error || 'Signup failed');
      }

      if (mockResponse.user && mockResponse.token) {
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, mockResponse.token),
          AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockResponse.user)),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, mockResponse.refreshToken || ''),
          AsyncStorage.setItem(TOKEN_EXPIRY_KEY, mockResponse.tokenExpiresAt || ''),
          AsyncStorage.setItem(REFRESH_EXPIRY_KEY, mockResponse.refreshTokenExpiresAt || ''),
        ]);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: mockResponse.user,
            accessToken: mockResponse.token,
            refreshToken: mockResponse.refreshToken || '',
            isNewSignup: true, // This is a signup, so it's a new user
          },
        });
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

      // Use mock OAuth authentication service
      const mockResponse = await mockAuthAPI.oauthLogin(provider);

      if (!mockResponse.success) {
        throw new Error(mockResponse.error || 'OAuth login failed');
      }

      if (mockResponse.user && mockResponse.token) {
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, mockResponse.token),
          AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockResponse.user)),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, mockResponse.refreshToken || ''),
          AsyncStorage.setItem(TOKEN_EXPIRY_KEY, mockResponse.tokenExpiresAt || ''),
          AsyncStorage.setItem(REFRESH_EXPIRY_KEY, mockResponse.refreshTokenExpiresAt || ''),
        ]);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: mockResponse.user,
            accessToken: mockResponse.token,
            refreshToken: mockResponse.refreshToken || '',
            isNewSignup: mockResponse.isNewUser || false, // Use OAuth response to determine if new user
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth login failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all stored authentication data
      await clearAuthStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still try to clear state even if storage clear fails
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshAuth = async (refreshToken?: string): Promise<boolean> => {
    try {
      const token = refreshToken || state.refreshToken;
      if (!token) return false;

      // Use mock auth service to refresh token
      const mockResponse = await mockAuthAPI.refreshToken(token);

      if (!mockResponse.success || !mockResponse.user || !mockResponse.token) {
        throw new Error(mockResponse.error || 'Token refresh failed');
      }

      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, mockResponse.token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockResponse.user));
      if (mockResponse.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, mockResponse.refreshToken);
      }
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: mockResponse.user,
          accessToken: mockResponse.token,
          refreshToken: mockResponse.refreshToken || token,
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