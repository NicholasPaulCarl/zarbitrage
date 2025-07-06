import React from 'react';
import { useTheme } from './ThemeContext';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const { theme } = useTheme();

  const getSizeStyles = (size: string) => {
    const sizes = {
      xs: { width: '1rem', height: '1rem', borderWidth: '2px' },
      sm: { width: '1.25rem', height: '1.25rem', borderWidth: '2px' },
      md: { width: '1.5rem', height: '1.5rem', borderWidth: '2px' },
      lg: { width: '2rem', height: '2rem', borderWidth: '3px' },
      xl: { width: '3rem', height: '3rem', borderWidth: '4px' }
    };

    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getVariantStyles = (variant: string) => {
    const variants = {
      primary: {
        borderColor: `${theme.colors.primary.main} transparent ${theme.colors.primary.main} transparent`
      },
      secondary: {
        borderColor: `${theme.colors.text.secondary} transparent ${theme.colors.text.secondary} transparent`
      },
      white: {
        borderColor: `${theme.colors.primary.contrast} transparent ${theme.colors.primary.contrast} transparent`
      }
    };

    return variants[variant as keyof typeof variants] || variants.primary;
  };

  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant);

  const spinnerStyles = {
    borderRadius: '50%',
    borderStyle: 'solid',
    animation: 'spin 1s linear infinite',
    ...sizeStyles,
    ...variantStyles
  };

  return (
    <>
      <div
        className={`inline-block ${className}`}
        style={spinnerStyles}
        role="status"
        aria-label="Loading"
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

// Overlay Spinner for full-screen loading
export interface SpinnerOverlayProps {
  isVisible: boolean;
  size?: 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
  backdrop?: boolean;
  message?: string;
}

export const SpinnerOverlay: React.FC<SpinnerOverlayProps> = ({
  isVisible,
  size = 'lg',
  variant = 'primary',
  backdrop = true,
  message
}) => {
  const { theme } = useTheme();

  if (!isVisible) return null;

  const overlayStyles = {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backgroundColor: backdrop ? theme.colors.background.overlay : 'transparent',
    backdropFilter: backdrop ? 'blur(4px)' : 'none'
  };

  return (
    <div style={overlayStyles}>
      <Spinner size={size} variant={variant} />
      {message && (
        <p 
          className="mt-4 text-sm"
          style={{ color: theme.colors.text.primary }}
        >
          {message}
        </p>
      )}
    </div>
  );
};