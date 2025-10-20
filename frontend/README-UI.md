# Anchor Social Feed Analytics - Mobile UI

A mobile-friendly React Native app for monitoring and analyzing social media content with AI-powered flagging and user feedback capabilities.

## Features

### 📊 Dashboard Screen
- **Analytics Overview**: Real-time metrics showing total posts, flagged content, and AI accuracy
- **Interactive Charts**: Line charts for engagement trends and flagged content over time
- **Content Distribution**: Pie chart showing breakdown of flagged content types
- **Recent Flags**: Quick preview of latest flagged content items
- **Time Range Selection**: Switch between 24h, 7d, and 30d views

### 📋 Content Review Screen
- **Flagged Content List**: Scrollable list of AI-flagged social media content
- **Interactive Filtering**: Filter by content type (misinformation, hate speech, spam, inappropriate)
- **Sorting Options**: Sort by newest, oldest, confidence level, or review status
- **Feedback System**: Mark content as correctly or incorrectly flagged
- **Detailed View**: Expandable cards showing flagging reasons and metadata
- **Pull to Refresh**: Update content with swipe gesture
- **Infinite Scroll**: Load more content automatically

### ⚙️ Settings Screen
- **Notifications**: Configure push notifications, email alerts, and flagged content notifications
- **Privacy Controls**: Manage data sharing and anonymous analytics preferences
- **Accessibility Options**: High contrast mode, large text, screen reader support
- **App Preferences**: Default time ranges, auto-refresh, detailed analytics
- **Account Management**: Export data, reset settings, delete account options

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Screen Reader Support**: Full VoiceOver/TalkBack compatibility
- **High Contrast Mode**: Enhanced color schemes for better visibility
- **Large Text Support**: Scalable font sizes (small to extra-large)
- **Touch Target Sizing**: Minimum 44px touch targets for all interactive elements
- **Color Independence**: Information not conveyed by color alone
- **Keyboard Navigation**: Full keyboard and switch control support

### Semantic HTML & ARIA
- Proper heading hierarchy with `accessibilityRole="header"`
- Descriptive labels and hints for all interactive elements
- Progress indicators with `accessibilityValue` attributes
- Form validation announcements
- Loading state announcements

### Focus Management
- Automatic focus management for screen readers
- Logical tab order through content
- Focus indicators for keyboard navigation
- Proper modal and overlay focus trapping

## Responsive Design

### Mobile-First Approach
- **Adaptive Layouts**: Components adjust to screen size and orientation
- **Responsive Grid System**: Auto-adjusting column counts based on screen width
- **Flexible Typography**: Font sizes scale with screen dimensions
- **Touch-Friendly**: Appropriately sized touch targets and spacing

### Screen Size Support
- **Phone**: < 768px width (1-2 columns)
- **Tablet**: 768px - 1024px width (2-3 columns)
- **Desktop**: > 1024px width (3-4 columns)

### Orientation Handling
- Automatic layout adjustments for landscape/portrait
- Chart sizing adapts to available space
- Modal presentations optimize for orientation

## Technology Stack

### Core Framework
- **React Native**: Cross-platform mobile development
- **Expo**: Development and build toolchain
- **TypeScript**: Type-safe development

### Navigation
- **Expo Router**: File-based routing with tabs
- **React Navigation**: Underlying navigation system

### Data Visualization
- **react-native-chart-kit**: Line charts and pie charts
- **react-native-svg**: Vector graphics support

### State Management
- **React Hooks**: Local state management
- **Context API**: Global accessibility settings
- **AsyncStorage**: Persistent settings storage

### Development Tools
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Prettier**: Code formatting

## Mock API Integration

The app includes a comprehensive mock API service that simulates backend responses:

### Analytics Data
- Dashboard metrics and engagement data
- Time-series data for charts
- Aggregated statistics

### Flagged Content
- Simulated AI-flagged social media posts
- Confidence scores and flagging reasons
- User feedback tracking
- Platform attribution (Twitter, Facebook, Instagram, TikTok)

### User Settings
- Notification preferences
- Privacy controls
- Accessibility options
- App preferences

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## File Structure

```
frontend/
├── app/                          # App screens and navigation
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── dashboard.tsx         # Analytics dashboard
│   │   ├── index.tsx             # Content review screen
│   │   ├── settings.tsx          # User settings
│   │   └── _layout.tsx           # Tab navigation setup
│   ├── _layout.tsx               # Root app layout
│   └── modal.tsx                 # Modal screen example
├── components/                   # Reusable components
│   ├── responsive/               # Responsive layout components
│   │   └── ResponsiveLayout.tsx
│   └── ui/                       # UI components
│       ├── AccessibleComponents.tsx
│       └── InteractiveComponents.tsx
├── hooks/                        # Custom React hooks
│   ├── useAccessibility.tsx      # Accessibility context and hooks
│   └── use-color-scheme.ts       # Color scheme detection
├── services/                     # API and data services
│   └── mockApi.ts                # Mock backend API
└── constants/                    # App constants and themes
    └── theme.ts
```

## Accessibility Testing

### Screen Reader Testing
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through each screen using gestures
3. Verify all content is announced correctly
4. Test interactive elements for proper labels

### Keyboard Navigation Testing
1. Connect external keyboard to device
2. Navigate using Tab, Arrow keys, Enter, Space
3. Verify focus indicators are visible
4. Test modal and overlay focus management

### Visual Testing
1. Enable high contrast mode in system settings
2. Test with large text sizes
3. Verify color contrast ratios meet WCAG standards
4. Test in both light and dark modes

## Performance Considerations

### Chart Rendering
- Charts are sized responsively to prevent performance issues
- Data is limited to prevent excessive rendering
- Smooth animations with reduced motion support

### List Performance
- FlatList virtualization for large content lists
- Proper keyExtractor for efficient re-rendering
- Pagination to limit initial data load

### Memory Management
- Proper component cleanup and effect dependencies
- Image optimization for various screen densities
- Efficient state updates to prevent unnecessary re-renders

## Future Enhancements

### Authentication Integration
- User login and registration flows
- Social media account linking
- Secure token storage

### Real-time Updates
- WebSocket integration for live data
- Push notification handling
- Background sync capabilities

### Advanced Analytics
- Custom date range selection
- Export functionality
- Comparative analysis features

### Offline Support
- Local data caching
- Offline feedback queue
- Sync when reconnected

## Contributing

When contributing to the mobile UI:

1. **Follow Accessibility Guidelines**: Ensure all new components meet WCAG 2.1 AA standards
2. **Test on Multiple Devices**: Verify functionality across different screen sizes
3. **Maintain Type Safety**: Use TypeScript for all new code
4. **Update Documentation**: Document new features and accessibility considerations
5. **Test with Screen Readers**: Verify compatibility with assistive technologies

## Support

For questions about the mobile UI implementation, accessibility features, or responsive design patterns, please refer to the component documentation and accessibility hooks provided in the codebase.