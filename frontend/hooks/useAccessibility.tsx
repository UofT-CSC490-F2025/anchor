import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  reducedMotionEnabled: boolean;
  colorSchemeOverride: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  preferredLanguage: string;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: any) => Promise<void>;
  isScreenReaderEnabled: boolean;
  isHighContrastEnabled: boolean;
  isLargeTextEnabled: boolean;
  isReducedMotionEnabled: boolean;
  effectiveColorScheme: 'light' | 'dark';
  fontScale: number;
  announceForScreenReader: (message: string) => void;
  vibrate: (pattern?: number | number[]) => void;
}

const defaultSettings: AccessibilitySettings = {
  screenReaderEnabled: false,
  highContrastEnabled: false,
  largeTextEnabled: false,
  reducedMotionEnabled: false,
  colorSchemeOverride: 'system',
  fontSize: 'medium',
  preferredLanguage: 'en',
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [systemScreenReader, setSystemScreenReader] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    // Load saved settings
    loadSettings();

    // Listen to system accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setSystemScreenReader
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReducedMotion
    );

    // Get initial system states
    AccessibilityInfo.isScreenReaderEnabled().then(setSystemScreenReader);
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReducedMotion);

    return () => {
      screenReaderListener.remove();
      reduceMotionListener.remove();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('accessibility_settings');
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  };

  const updateSetting = async (key: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  };

  const announceForScreenReader = (message: string) => {
    if (isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const vibrate = (pattern?: number | number[]) => {
    // Only vibrate if reduced motion is not enabled
    if (!isReducedMotionEnabled) {
      // Note: Haptics would be handled by expo-haptics in a real implementation
      console.log('Vibration pattern:', pattern);
    }
  };

  const getEffectiveColorScheme = (): 'light' | 'dark' => {
    if (settings.colorSchemeOverride === 'system') {
      return Appearance.getColorScheme() || 'light';
    }
    return settings.colorSchemeOverride;
  };

  const getFontScale = (): number => {
    const scales = {
      'small': 0.85,
      'medium': 1.0,
      'large': 1.15,
      'extra-large': 1.3,
    };
    return scales[settings.fontSize];
  };

  const isScreenReaderEnabled = settings.screenReaderEnabled || systemScreenReader;
  const isHighContrastEnabled = settings.highContrastEnabled;
  const isLargeTextEnabled = settings.largeTextEnabled || settings.fontSize === 'large' || settings.fontSize === 'extra-large';
  const isReducedMotionEnabled = settings.reducedMotionEnabled || systemReducedMotion;
  const effectiveColorScheme = getEffectiveColorScheme();
  const fontScale = getFontScale();

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    isScreenReaderEnabled,
    isHighContrastEnabled,
    isLargeTextEnabled,
    isReducedMotionEnabled,
    effectiveColorScheme,
    fontScale,
    announceForScreenReader,
    vibrate,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Hook for focus management
export const useFocusManagement = () => {
  const { isScreenReaderEnabled } = useAccessibility();

  const setFocus = (ref: React.RefObject<any>) => {
    if (ref.current && isScreenReaderEnabled) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        if (ref.current?.focus) {
          ref.current.focus();
        } else if (ref.current?.setNativeProps) {
          ref.current.setNativeProps({ accessibilityElementsHidden: false });
        }
      }, 100);
    }
  };

  const moveFocus = (direction: 'next' | 'previous') => {
    if (isScreenReaderEnabled) {
      // This would integrate with React Navigation or custom focus management
      console.log(`Moving focus ${direction}`);
    }
  };

  return { setFocus, moveFocus };
};

// Hook for semantic announcements
export const useAnnouncements = () => {
  const { announceForScreenReader, isScreenReaderEnabled } = useAccessibility();

  const announcePageChange = (pageName: string) => {
    announceForScreenReader(`Navigated to ${pageName}`);
  };

  const announceLoading = (isLoading: boolean, context?: string) => {
    const message = isLoading 
      ? `Loading${context ? ` ${context}` : ''}...` 
      : `Finished loading${context ? ` ${context}` : ''}`;
    announceForScreenReader(message);
  };

  const announceError = (error: string) => {
    announceForScreenReader(`Error: ${error}`);
  };

  const announceSuccess = (message: string) => {
    announceForScreenReader(`Success: ${message}`);
  };

  const announceFormValidation = (field: string, error?: string) => {
    if (error) {
      announceForScreenReader(`${field} has error: ${error}`);
    } else {
      announceForScreenReader(`${field} is valid`);
    }
  };

  return {
    announcePageChange,
    announceLoading,
    announceError,
    announceSuccess,
    announceFormValidation,
    isScreenReaderEnabled,
  };
};

// Custom hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const { isScreenReaderEnabled } = useAccessibility();

  const handleKeyPress = (
    event: any,
    onEnter?: () => void,
    onSpace?: () => void,
    onEscape?: () => void
  ) => {
    if (!isScreenReaderEnabled) return;

    switch (event.key) {
      case 'Enter':
        onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        onSpace?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
    }
  };

  return { handleKeyPress };
};

// Utility functions for accessible content
export const accessibilityUtils = {
  // Generate accessible label for data
  formatDataForScreenReader: (data: any[], label: string) => {
    if (!Array.isArray(data) || data.length === 0) {
      return `${label}: No data available`;
    }
    return `${label}: ${data.length} items. ${data.map((item, index) => 
      `Item ${index + 1}: ${JSON.stringify(item)}`
    ).join(', ')}`;
  },

  // Format numbers for screen readers
  formatNumberForScreenReader: (num: number, unit?: string) => {
    const formatted = num.toLocaleString();
    return `${formatted}${unit ? ` ${unit}` : ''}`;
  },

  // Format dates for screen readers
  formatDateForScreenReader: (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Generate table description for screen readers
  generateTableDescription: (data: any[], columns: string[]) => {
    return `Table with ${data.length} rows and ${columns.length} columns. Column headers: ${columns.join(', ')}`;
  },

  // Generate chart description for screen readers
  generateChartDescription: (type: string, data: any[], trend?: string) => {
    const dataPoints = data.length;
    let description = `${type} chart with ${dataPoints} data points`;
    
    if (trend) {
      description += `. Overall trend: ${trend}`;
    }

    if (data.length > 0) {
      const values = data.map(d => typeof d === 'object' ? d.value : d).filter(v => typeof v === 'number');
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        description += `. Range from ${min} to ${max}`;
      }
    }

    return description;
  },
};