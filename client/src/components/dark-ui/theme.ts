export const darkTheme = {
  colors: {
    // Primary colors - custom purple brand
    primary: {
      main: '#6D00D1',      // Custom purple brand color
      light: '#8B33FF',
      dark: '#5500A8',
      contrast: '#FFFFFF'
    },
    
    // Background colors - dark mode inspired
    background: {
      primary: '#0A0A0A',    // Deep black
      secondary: '#141414',   // Slightly lighter black
      tertiary: '#1F1F1F',    // Card backgrounds
      elevated: '#2A2A2A',    // Elevated surfaces
      overlay: 'rgba(0, 0, 0, 0.7)'
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      tertiary: '#717171',
      disabled: '#484848',
      inverse: '#000000'
    },
    
    // Border colors
    border: {
      primary: '#2A2A2A',
      secondary: '#1F1F1F',
      light: '#3A3A3A',
      focus: '#6D00D1'
    },
    
    // Status colors
    status: {
      success: '#00A569',
      warning: '#FFB400',
      error: '#E84855',
      info: '#428BFF'
    },
    
    // Chart colors - for visx visualizations
    chart: {
      primary: ['#6D00D1', '#8B33FF', '#B566FF'],
      secondary: ['#7B61FF', '#9B85FF', '#BDB0FF'],
      tertiary: ['#00A569', '#00C873', '#4CE89F'],
      quaternary: ['#FFB400', '#FFC733', '#FFDB66'],
      gradient: {
        primary: ['#6D00D1', '#8B33FF'],
        secondary: ['#7B61FF', '#9B85FF'],
        success: ['#00A569', '#00C873'],
        warning: ['#FFB400', '#FFC733']
      }
    }
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SF Mono, Monaco, Consolas, "Courier New", monospace'
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem'      // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(109, 0, 209, 0.3)'
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out'
  },
  
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070
  }
};

export const lightTheme = {
  colors: {
    // Primary colors - same as dark theme
    primary: {
      main: '#6D00D1',      // Custom purple brand color
      light: '#8B33FF',
      dark: '#5500A8',
      contrast: '#FFFFFF'
    },
    
    // Background colors - light mode
    background: {
      primary: '#FFFFFF',    // Pure white
      secondary: '#F8F9FA',  // Light gray
      tertiary: '#F1F3F4',   // Card backgrounds
      elevated: '#FFFFFF',   // Elevated surfaces with shadow
      overlay: 'rgba(0, 0, 0, 0.4)'
    },
    
    // Text colors - inverted for light mode
    text: {
      primary: '#1A1A1A',    // Nearly black
      secondary: '#6B7280',  // Medium gray
      tertiary: '#9CA3AF',   // Light gray
      disabled: '#D1D5DB',   // Very light gray
      inverse: '#FFFFFF'     // White for dark backgrounds
    },
    
    // Border colors - light mode
    border: {
      primary: '#E5E7EB',    // Light gray border
      secondary: '#F3F4F6',  // Very light gray
      light: '#D1D5DB',      // Medium gray
      focus: '#6D00D1'       // Primary color for focus
    },
    
    // Status colors - same as dark theme
    status: {
      success: '#00A569',
      warning: '#FFB400',
      error: '#E84855',
      info: '#428BFF'
    },
    
    // Chart colors - adjusted for light mode
    chart: {
      primary: ['#6D00D1', '#8B33FF', '#B566FF'],
      secondary: ['#7B61FF', '#9B85FF', '#BDB0FF'],
      tertiary: ['#00A569', '#00C873', '#4CE89F'],
      quaternary: ['#FFB400', '#FFC733', '#FFDB66'],
      gradient: {
        primary: ['#6D00D1', '#8B33FF'],
        secondary: ['#7B61FF', '#9B85FF'],
        success: ['#00A569', '#00C873'],
        warning: ['#FFB400', '#FFC733']
      }
    }
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SF Mono, Monaco, Consolas, "Courier New", monospace'
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem'      // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(109, 0, 209, 0.15)'
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out'
  },
  
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070
  }
};

export type Theme = typeof darkTheme;

// Theme context types
export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// Helper function to get theme by mode
export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'light' ? lightTheme : darkTheme;
}; 