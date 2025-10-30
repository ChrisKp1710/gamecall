/** 
 * Design System GameCall 2025
 * Minimal, Modern, Professional
 */

export const colors = {
  // Light Mode
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F7',
    border: '#E5E5EA',
    text: {
      primary: '#1D1D1F',
      secondary: '#6E6E73',
      tertiary: '#86868B',
    },
    accent: {
      primary: '#007AFF',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
    },
  },

  // Dark Mode
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    border: '#38383A',
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#AEAEB2',
    },
    accent: {
      primary: '#0A84FF',
      success: '#30D158',
      error: '#FF453A',
      warning: '#FF9F0A',
    },
  },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
