import React from 'react';
import { View, ViewStyle, useWindowDimensions } from 'react-native';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  padding?: number;
  horizontalPadding?: number;
  verticalPadding?: number;
}

export const ResponsiveContainer: React.FC<ResponsiveLayoutProps> = ({
  children,
  style,
  maxWidth = 768,
  padding = 16,
  horizontalPadding,
  verticalPadding,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;

  const containerStyle: ViewStyle = {
    flex: 1,
    maxWidth: isLargeScreen ? maxWidth : width,
    width: '100%',
    paddingHorizontal: horizontalPadding ?? (isTablet ? padding * 1.5 : padding),
    paddingVertical: verticalPadding ?? padding,
    alignSelf: 'center',
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
};

interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<GridLayoutProps> = ({
  children,
  columns,
  spacing = 16,
  style,
}) => {
  const { width } = useWindowDimensions();
  
  // Determine optimal columns based on screen width
  const getOptimalColumns = () => {
    if (columns) return columns;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 480) return 2;
    return 1;
  };

  const numColumns = getOptimalColumns();
  const itemWidth = (width - (numColumns + 1) * spacing) / numColumns;

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing / 2,
    ...style,
  };

  const childrenArray = React.Children.toArray(children);

  return (
    <View style={gridStyle}>
      {childrenArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: itemWidth,
            marginBottom: spacing,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: number;
}

export const ResponsiveCard: React.FC<CardProps> = ({
  children,
  style,
  elevated = true,
  padding = 16,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const cardStyle: ViewStyle = {
    backgroundColor: '#ffffff',
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? padding * 1.2 : padding,
    marginVertical: 8,
    ...(elevated && {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
    ...style,
  };

  return <View style={cardStyle}>{children}</View>;
};

interface FlexLayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  wrap?: boolean;
  gap?: number;
  style?: ViewStyle;
}

export const FlexLayout: React.FC<FlexLayoutProps> = ({
  children,
  direction = 'column',
  justify = 'flex-start',
  align = 'stretch',
  wrap = false,
  gap = 0,
  style,
}) => {
  const { width } = useWindowDimensions();
  const shouldWrap = width < 768 && wrap;

  const flexStyle: ViewStyle = {
    flexDirection: shouldWrap ? 'column' : direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: gap,
    ...style,
  };

  return <View style={flexStyle}>{children}</View>;
};

// Screen size hooks and utilities
export const useScreenSize = () => {
  const { width, height } = useWindowDimensions();
  
  return {
    width,
    height,
    isSmall: width < 480,
    isMedium: width >= 480 && width < 768,
    isLarge: width >= 768 && width < 1024,
    isXLarge: width >= 1024,
    isTablet: width >= 768,
    isPhone: width < 768,
    orientation: width > height ? 'landscape' : 'portrait',
  };
};

export const getResponsiveFontSize = (baseSize: number, screenWidth: number) => {
  if (screenWidth >= 1024) return baseSize * 1.2;
  if (screenWidth >= 768) return baseSize * 1.1;
  if (screenWidth < 480) return baseSize * 0.9;
  return baseSize;
};

export const getResponsiveSpacing = (baseSpacing: number, screenWidth: number) => {
  if (screenWidth >= 1024) return baseSpacing * 1.5;
  if (screenWidth >= 768) return baseSpacing * 1.25;
  if (screenWidth < 480) return baseSpacing * 0.8;
  return baseSpacing;
};