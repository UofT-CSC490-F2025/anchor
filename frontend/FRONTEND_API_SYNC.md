# Frontend API Synchronization with Database Schema

## Overview

This document outlines the changes made to synchronize the frontend with the comprehensive database schema for user-scoped content analysis and monitoring.

## Key Changes Made

### 1. Database Schema Types (`types/database.ts`)

Created comprehensive TypeScript interfaces matching the complete database schema:

- **User Management**: `User`, `UserProfile`, `UserAccount`, `Device`, `PrivacyConsent`
- **Content Analysis**: `Video`, `VideoWithAnalysis`, `AnalysisRun`, `DetectionLabel`, `AudioTranscript`
- **Trust & Scoring**: `UserTrustScore`, `ContentReport`, `ExposureSummary`
- **Notifications**: `RealTimeAlert`, `Notification`
- **Metadata**: `Model`, `ContentCategory`, `Upload`, `IngestionJob`
- **Logging**: `Log`, `Feedback`

### 2. Authentication Context (`contexts/AuthContext.tsx`)

Implemented comprehensive user authentication system:

- **Authentication State Management**: Login, logout, token refresh
- **OAuth Support**: Google, Facebook, Twitter integration
- **Persistent Session**: AsyncStorage integration
- **User Profile Management**: Profile updates, user context
- **Security**: Automatic token refresh, secure storage

### 3. User-Scoped API Services

#### Base API Service (`services/baseApi.ts`)
- Enhanced with authentication headers
- Token management integration
- Error handling improvements

#### Content Service (`services/contentService.ts`)
- **User-Scoped Endpoints**: All data filtered by authenticated user
- **Comprehensive Methods**:
  - `getAnalytics()` - User's analytics data
  - `getFlaggedContent()` - User's flagged videos with filters
  - `getVideoById()` - Individual video analysis
  - `submitFeedback()` - Analysis feedback submission
  - `getDashboardSummary()` - User dashboard data
  - `getExposureSummaries()` - Content exposure analysis
  - `reportContent()` - Content reporting
  - `exportFlaggedContent()` - Data export (GDPR)
  - `triggerAnalysis()` - Manual analysis requests
  - `getNotifications()` - User notifications

#### User Service (`services/userService.ts`)
- **Profile Management**: Get/update user profile
- **Account Connections**: Social media account management
- **Device Management**: Push notification device registration
- **Privacy Controls**: Consent management
- **Trust Scoring**: User trust score access
- **Real-time Alerts**: Alert configuration
- **Data Export**: GDPR compliance features
- **Activity Logs**: User action transparency

### 4. Authenticated API Hooks (`hooks/useApiServices.ts`)

Provides React hooks for authenticated API access:
- `useApiServices()` - Returns all authenticated services
- `useContentService()` - Content-specific operations
- `useUserService()` - User management operations

### 5. Updated App Structure

#### Root Layout (`app/_layout.tsx`)
- Added `AuthProvider` wrapper for app-wide authentication context

#### Content Screen (`app/(tabs)/index.tsx`)
- **Authentication Checks**: Requires user login
- **User-Scoped Data**: Only shows user's content
- **Updated Data Models**: Uses new schema types
- **Enhanced Filtering**: Platform, content type, risk level filters
- **Proper Feedback**: Analysis run feedback instead of simple correct/incorrect

#### Dashboard Screen (`app/(tabs)/dashboard.tsx`)
- **Authentication Required**: Login-gated access
- **User-Specific Metrics**: Personal analytics only
- **Enhanced Visualization**: Charts based on user's data
- **Real-time Updates**: User-scoped notifications and alerts

### 6. Type Safety Improvements

#### Updated API Types (`types/api.ts`)
- **Authentication Types**: `AuthResponse`, login/OAuth requests
- **User Management**: Profile updates, account connections
- **Enhanced FlaggedContent**: Based on `VideoWithAnalysis` schema
- **Backward Compatibility**: Maintains existing type interfaces

#### Chart Helpers (`utils/chartHelpers.ts`)
- Utility functions for generating charts from analytics data
- Support for new schema structure

## Security Features

### 1. User Data Isolation
- **API Endpoints**: All return only data belonging to authenticated user
- **Database Scoping**: User ID filtering on all queries
- **Cross-User Protection**: No access to other users' data

### 2. Authentication Security
- **JWT Tokens**: Secure access and refresh token system
- **Automatic Refresh**: Seamless token renewal
- **Secure Storage**: AsyncStorage for persistent auth
- **Session Management**: Proper login/logout flows

### 3. Privacy Compliance
- **Consent Management**: Privacy consent tracking
- **Data Export**: GDPR-compliant data export
- **Activity Logging**: Transparent user action logs
- **Account Deletion**: Complete data removal capability

## API Endpoints Expected by Frontend

Based on the implemented frontend, the backend should provide these user-scoped endpoints:

### Authentication
- `POST /auth/login` - Email/password login
- `POST /auth/oauth` - OAuth provider login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Session termination

### User Management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/accounts` - Get connected social accounts
- `POST /users/accounts` - Connect new social account
- `DELETE /users/accounts/{id}` - Disconnect account
- `GET /users/devices` - Get registered devices
- `POST /users/devices` - Register new device
- `GET /users/privacy-consents` - Get privacy consents
- `POST /users/privacy-consents` - Grant consent

### Content Analysis
- `GET /users/analytics` - User's analytics data
- `GET /users/videos/flagged` - User's flagged content
- `GET /users/videos/{id}` - Specific video analysis
- `POST /users/feedback` - Submit analysis feedback
- `GET /users/dashboard/summary` - Dashboard data
- `GET /users/exposure-summaries` - Exposure analysis
- `POST /users/reports` - Report content
- `POST /users/export/flagged-content` - Export data

### Notifications
- `GET /users/notifications` - Get user notifications
- `PUT /users/notifications/{id}/read` - Mark notification read
- `GET /users/alerts` - Get real-time alerts
- `POST /users/alerts` - Create alert configuration

## Migration Path

### For Existing Code
1. **Mock Service**: Current screens still reference mock data - gradually replace with authenticated services
2. **Type Updates**: Update component props to use new schema types
3. **Authentication**: Add login screens and authentication flows
4. **Error Handling**: Update error messages for authentication failures

### For Backend Implementation
1. **User Scoping**: Ensure all endpoints filter by authenticated user
2. **Authentication**: Implement JWT token system
3. **Privacy Controls**: Add consent and data export features
4. **Notification System**: Implement real-time alerts and notifications

## Testing Considerations

### Unit Tests
- Authentication context state management
- API service error handling
- User data isolation verification

### Integration Tests
- Login/logout flows
- API service authentication headers
- Data filtering by user ID

### Security Tests
- Cross-user data access prevention
- Token expiration handling
- Secure storage verification

## Next Steps

1. **Login Screens**: Implement authentication UI components
2. **Error Boundaries**: Add proper error handling for auth failures
3. **Loading States**: Enhance loading indicators for async operations
4. **Offline Support**: Consider caching strategies for user data
5. **Push Notifications**: Implement notification handling
6. **Settings Screen**: Add user preferences and privacy controls

This implementation ensures that the frontend is fully synchronized with the database schema while maintaining strict user data isolation and security best practices.