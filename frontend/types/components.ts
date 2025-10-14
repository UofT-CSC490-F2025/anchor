/**
 * Component Props Types
 * Reusable type definitions for component props
 */

import { ViewStyle, TextStyle } from 'react-native';
import { ReactNode } from 'react';

// Base component props
export interface BaseComponentProps {
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Layout Props
export interface LayoutProps extends BaseComponentProps {
  children: ReactNode;
  gap?: number;
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  margin?: number | { top?: number; bottom?: number; left?: number; right?: number };
}

export interface FlexLayoutProps extends LayoutProps {
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean;
}

// Button Props
export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Text Props
export interface TextProps {
  children: ReactNode;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'label';
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  accessibilityRole?: 'header' | 'text' | 'summary';
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Card Props
export interface CardProps extends BaseComponentProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
}

// Filter and Sort Props
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  filterOptions: FilterOption[];
}

export interface SortProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  sortOptions: SortOption[];
}

// Screen Props
export interface ScreenProps {
  navigation?: any; // Replace with proper navigation type if using React Navigation
  route?: any; // Replace with proper route type if using React Navigation
}

// Form Props
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface InputProps extends FormFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
}

// List Props
export interface ListItemProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

// Modal Props
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
}

// Progress Props
export interface ProgressProps extends BaseComponentProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}