/**
 * TikTok Context
 * Manages TikTok account linking and integration state
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockTikTokService, TikTokProfile, TikTokVideo } from '@/services/mockTikTokService';
import { useAuth } from './AuthContext';

// TikTok State Interface
interface TikTokState {
  isLinked: boolean;
  isLoading: boolean;
  profile: TikTokProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  error: string | null;
  feed: TikTokVideo[];
  feedLoading: boolean;
  feedCursor: string | null;
}

// TikTok Actions
type TikTokAction =
  | { type: 'TIKTOK_LOADING'; payload: boolean }
  | { type: 'TIKTOK_FEED_LOADING'; payload: boolean }
  | { type: 'TIKTOK_LINK_SUCCESS'; payload: { profile: TikTokProfile; accessToken: string; refreshToken: string; expiresIn: number } }
  | { type: 'TIKTOK_ERROR'; payload: string }
  | { type: 'TIKTOK_UNLINK' }
  | { type: 'TIKTOK_FEED_SUCCESS'; payload: { videos: TikTokVideo[]; nextCursor?: string | undefined; append?: boolean } }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: TikTokState = {
  isLinked: false,
  isLoading: true,
  profile: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  error: null,
  feed: [],
  feedLoading: false,
  feedCursor: null,
};

// TikTok Reducer
function tiktokReducer(state: TikTokState, action: TikTokAction): TikTokState {
  switch (action.type) {
    case 'TIKTOK_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    case 'TIKTOK_FEED_LOADING':
      return {
        ...state,
        feedLoading: action.payload,
      };
    case 'TIKTOK_LINK_SUCCESS':
      return {
        ...state,
        isLinked: true,
        isLoading: false,
        profile: action.payload.profile,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        tokenExpiry: Date.now() + (action.payload.expiresIn * 1000),
        error: null,
      };
    case 'TIKTOK_ERROR':
      return {
        ...state,
        isLoading: false,
        feedLoading: false,
        error: action.payload,
      };
    case 'TIKTOK_UNLINK':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'TIKTOK_FEED_SUCCESS': {
      let newFeed: TikTokVideo[];
      if (action.payload.append) {
        // When appending, filter out any duplicates based on video ID
        const existingIds = new Set(state.feed.map(video => video.id));
        const newVideos = action.payload.videos.filter(video => !existingIds.has(video.id));
        newFeed = [...state.feed, ...newVideos];
      } else {
        newFeed = action.payload.videos;
      }
      
      return {
        ...state,
        feedLoading: false,
        feed: newFeed,
        feedCursor: action.payload.nextCursor || null,
        error: null,
      };
    }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Context Interface
interface TikTokContextType extends TikTokState {
  initiateLinking: () => Promise<string>;
  completeLinking: (authCode: string) => Promise<void>;
  unlinkAccount: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  clearError: () => void;
  checkLinkStatus: () => Promise<void>;
}

// Create Context
const TikTokContext = createContext<TikTokContextType | undefined>(undefined);

// TikTok Provider Component
interface TikTokProviderProps {
  children: ReactNode;
}

export function TikTokProvider({ children }: TikTokProviderProps) {
  const [state, dispatch] = useReducer(tiktokReducer, initialState);
  const { user } = useAuth();

  // Storage Keys
  const TIKTOK_ACCESS_TOKEN_KEY = 'tiktok_access_token';
  const TIKTOK_REFRESH_TOKEN_KEY = 'tiktok_refresh_token';
  const TIKTOK_PROFILE_KEY = 'tiktok_profile';
  const TIKTOK_TOKEN_EXPIRY_KEY = 'tiktok_token_expiry';

  // Initialize TikTok state from storage
  useEffect(() => {
    if (user) {
      initializeTikTokState();
    } else {
      // Clear TikTok state if user is not logged in
      dispatch({ type: 'TIKTOK_UNLINK' });
    }
  }, [user]);

  const initializeTikTokState = async () => {
    try {
      dispatch({ type: 'TIKTOK_LOADING', payload: true });

      const [accessToken, refreshToken, profileData, tokenExpiry] = await Promise.all([
        AsyncStorage.getItem(`${TIKTOK_ACCESS_TOKEN_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${TIKTOK_REFRESH_TOKEN_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${TIKTOK_PROFILE_KEY}_${user?.id}`),
        AsyncStorage.getItem(`${TIKTOK_TOKEN_EXPIRY_KEY}_${user?.id}`),
      ]);

      if (accessToken && refreshToken && profileData && tokenExpiry) {
        const profile = JSON.parse(profileData) as TikTokProfile;
        const expiry = parseInt(tokenExpiry);
        
        // Check if token is still valid
        if (Date.now() < expiry) {
          // Token is still valid
          dispatch({
            type: 'TIKTOK_LINK_SUCCESS',
            payload: {
              profile,
              accessToken,
              refreshToken,
              expiresIn: Math.floor((expiry - Date.now()) / 1000),
            },
          });
          
          // Load initial feed
          await loadFeed(accessToken);
          return;
        } else {
          // Try to refresh token
          const refreshResponse = await mockTikTokService.refreshToken(refreshToken);
          if (refreshResponse.success && refreshResponse.accessToken) {
            // Store new tokens
            await storeTikTokTokens(
              refreshResponse.accessToken,
              refreshResponse.refreshToken || refreshToken,
              profile,
              refreshResponse.expiresIn || 7200
            );
            
            dispatch({
              type: 'TIKTOK_LINK_SUCCESS',
              payload: {
                profile,
                accessToken: refreshResponse.accessToken,
                refreshToken: refreshResponse.refreshToken || refreshToken,
                expiresIn: refreshResponse.expiresIn || 7200,
              },
            });
            
            // Load initial feed
            await loadFeed(refreshResponse.accessToken);
            return;
          }
        }
        
        // Token refresh failed, clear stored data
        await clearTikTokStorage();
      }

      dispatch({ type: 'TIKTOK_LOADING', payload: false });
    } catch (error) {
      console.error('TikTok initialization error:', error);
      await clearTikTokStorage();
      dispatch({ type: 'TIKTOK_ERROR', payload: 'Failed to initialize TikTok connection' });
    }
  };

  const initiateLinking = async (): Promise<string> => {
    try {
      dispatch({ type: 'TIKTOK_LOADING', payload: true });
      
      const response = await mockTikTokService.initiateAuth();
      
      if (!response.success || !response.authUrl) {
        throw new Error(response.error || 'Failed to initiate TikTok linking');
      }
      
      dispatch({ type: 'TIKTOK_LOADING', payload: false });
      return response.authUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate TikTok linking';
      dispatch({ type: 'TIKTOK_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const completeLinking = async (authCode: string) => {
    try {
      dispatch({ type: 'TIKTOK_LOADING', payload: true });
      
      const response = await mockTikTokService.exchangeCodeForToken(authCode);
      
      if (!response.success || !response.accessToken || !response.profile) {
        throw new Error(response.error || 'Failed to complete TikTok linking');
      }
      
      // Store tokens and profile
      await storeTikTokTokens(
        response.accessToken,
        response.refreshToken || '',
        response.profile,
        response.expiresIn || 7200
      );
      
      dispatch({
        type: 'TIKTOK_LINK_SUCCESS',
        payload: {
          profile: response.profile,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || '',
          expiresIn: response.expiresIn || 7200,
        },
      });
      
      // Load initial feed
      await loadFeed(response.accessToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete TikTok linking';
      dispatch({ type: 'TIKTOK_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const unlinkAccount = async () => {
    try {
      dispatch({ type: 'TIKTOK_LOADING', payload: true });
      
      if (state.accessToken) {
        await mockTikTokService.disconnectAccount(state.accessToken);
      }
      
      await clearTikTokStorage();
      dispatch({ type: 'TIKTOK_UNLINK' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlink TikTok account';
      dispatch({ type: 'TIKTOK_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const loadFeed = async (accessToken: string, cursor?: string, append = false) => {
    try {
      if (!append) {
        dispatch({ type: 'TIKTOK_FEED_LOADING', payload: true });
      }
      
      const response = await mockTikTokService.getUserFeed(accessToken, cursor);
      
      if (!response.success || !response.videos) {
        throw new Error(response.error || 'Failed to load TikTok feed');
      }
      
      dispatch({
        type: 'TIKTOK_FEED_SUCCESS',
        payload: {
          videos: response.videos,
          nextCursor: response.nextCursor,
          append,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load TikTok feed';
      dispatch({ type: 'TIKTOK_ERROR', payload: errorMessage });
    }
  };

  const refreshFeed = async () => {
    if (!state.accessToken) {
      dispatch({ type: 'TIKTOK_ERROR', payload: 'No TikTok account linked' });
      return;
    }
    
    await loadFeed(state.accessToken);
  };

  const loadMoreFeed = async () => {
    if (!state.accessToken || !state.feedCursor || state.feedLoading) {
      return;
    }
    
    await loadFeed(state.accessToken, state.feedCursor, true);
  };

  const checkLinkStatus = async () => {
    if (!state.accessToken) {
      return;
    }
    
    try {
      const response = await mockTikTokService.getUserProfile(state.accessToken);
      
      if (!response.success) {
        // Token might be invalid, try to refresh
        if (state.refreshToken) {
          const refreshResponse = await mockTikTokService.refreshToken(state.refreshToken);
          if (refreshResponse.success && refreshResponse.accessToken) {
            // Store new tokens
            await storeTikTokTokens(
              refreshResponse.accessToken,
              refreshResponse.refreshToken || state.refreshToken,
              state.profile!,
              refreshResponse.expiresIn || 7200
            );
            
            dispatch({
              type: 'TIKTOK_LINK_SUCCESS',
              payload: {
                profile: state.profile!,
                accessToken: refreshResponse.accessToken,
                refreshToken: refreshResponse.refreshToken || state.refreshToken,
                expiresIn: refreshResponse.expiresIn || 7200,
              },
            });
            return;
          }
        }
        
        // Refresh failed, unlink account
        await clearTikTokStorage();
        dispatch({ type: 'TIKTOK_UNLINK' });
      }
    } catch (error) {
      console.error('TikTok status check failed:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Helper functions
  const storeTikTokTokens = async (
    accessToken: string,
    refreshToken: string,
    profile: TikTokProfile,
    expiresIn: number
  ) => {
    if (!user?.id) return;
    
    const expiry = Date.now() + (expiresIn * 1000);
    
    await Promise.all([
      AsyncStorage.setItem(`${TIKTOK_ACCESS_TOKEN_KEY}_${user.id}`, accessToken),
      AsyncStorage.setItem(`${TIKTOK_REFRESH_TOKEN_KEY}_${user.id}`, refreshToken),
      AsyncStorage.setItem(`${TIKTOK_PROFILE_KEY}_${user.id}`, JSON.stringify(profile)),
      AsyncStorage.setItem(`${TIKTOK_TOKEN_EXPIRY_KEY}_${user.id}`, expiry.toString()),
    ]);
  };

  const clearTikTokStorage = async () => {
    if (!user?.id) return;
    
    await Promise.all([
      AsyncStorage.removeItem(`${TIKTOK_ACCESS_TOKEN_KEY}_${user.id}`),
      AsyncStorage.removeItem(`${TIKTOK_REFRESH_TOKEN_KEY}_${user.id}`),
      AsyncStorage.removeItem(`${TIKTOK_PROFILE_KEY}_${user.id}`),
      AsyncStorage.removeItem(`${TIKTOK_TOKEN_EXPIRY_KEY}_${user.id}`),
    ]);
  };

  const contextValue: TikTokContextType = {
    ...state,
    initiateLinking,
    completeLinking,
    unlinkAccount,
    refreshFeed,
    loadMoreFeed,
    clearError,
    checkLinkStatus,
  };

  return (
    <TikTokContext.Provider value={contextValue}>
      {children}
    </TikTokContext.Provider>
  );
}

// Custom hook to use TikTok context
export function useTikTok(): TikTokContextType {
  const context = useContext(TikTokContext);
  if (context === undefined) {
    throw new Error('useTikTok must be used within a TikTokProvider');
  }
  return context;
}