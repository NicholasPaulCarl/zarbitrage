import React from 'react';
import { useTheme } from './ThemeContext';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  outline?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pill = false,
  outline = false,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (variant: string, outline: boolean) => {
    const variants = {
      default: {
        bg: outline ? 'transparent' : theme.colors.background.tertiary,
        color: theme.colors.text.primary,
        border: outline ? theme.colors.border.primary : 'transparent'
      },
      primary: {
        bg: outline ? 'transparent' : theme.colors.primary.main,
        color: outline ? theme.colors.primary.main : theme.colors.primary.contrast,
        border: outline ? theme.colors.primary.main : 'transparent'
      },
      secondary: {
        bg: outline ? 'transparent' : theme.colors.background.elevated,
        color: theme.colors.text.secondary,
        border: outline ? theme.colors.border.light : 'transparent'
      },
      success: {
        bg: outline ? 'transparent' : theme.colors.status.success,
        color: outline ? theme.colors.status.success : theme.colors.primary.contrast,
        border: outline ? theme.colors.status.success : 'transparent'
      },
      warning: {
        bg: outline ? 'transparent' : theme.colors.status.warning,
        color: outline ? theme.colors.status.warning : theme.colors.primary.contrast,
        border: outline ? theme.colors.status.warning : 'transparent'
      },
      error: {
        bg: outline ? 'transparent' : theme.colors.status.error,
        color: outline ? theme.colors.status.error : theme.colors.primary.contrast,
        border: outline ? theme.colors.status.error : 'transparent'
      },
      info: {
        bg: outline ? 'transparent' : theme.colors.status.info,
        color: outline ? theme.colors.status.info : theme.colors.primary.contrast,
        border: outline ? theme.colors.status.info : 'transparent'
      }
    };

    return variants[variant as keyof typeof variants] || variants.default;
  };

  const getSizeStyles = (size: string) => {
    const sizes = {
      sm: {
        padding: '0.125rem 0.375rem',
        fontSize: '0.75rem',
        fontWeight: '500'
      },
      md: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      },
      lg: {
        padding: '0.375rem 0.75rem',
        fontSize: '1rem',
        fontWeight: '600'
      }
    };

    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const variantStyles = getVariantStyles(variant, outline);
  const sizeStyles = getSizeStyles(size);

  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: pill ? '9999px' : '0.375rem',
    backgroundColor: variantStyles.bg,
    color: variantStyles.color,
    borderWidth: outline ? '1px' : '0',
    borderStyle: 'solid',
    borderColor: variantStyles.border,
    transition: 'all 0.2s ease-in-out',
    ...sizeStyles
  };

  return (
    <span
      className={`whitespace-nowrap ${className}`}
      style={badgeStyles}
      {...props}
    >
      {children}
    </span>
  );
};