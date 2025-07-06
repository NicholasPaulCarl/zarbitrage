import React from 'react';
import { useTheme } from './ThemeContext';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useTheme();
  
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold rounded-lg
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
    disabled:opacity-50 disabled:cursor-not-allowed
    transform active:scale-95
    ${fullWidth ? 'w-full' : ''}
  `;

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary.main,
          color: theme.colors.primary.contrast,
          borderColor: 'transparent'
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.background.tertiary,
          color: theme.colors.text.primary,
          borderColor: theme.colors.border.primary
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: theme.colors.text.primary,
          borderColor: 'transparent'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: theme.colors.primary.main,
          borderColor: theme.colors.primary.main,
          borderWidth: '2px'
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.status.error,
          color: theme.colors.primary.contrast,
          borderColor: 'transparent'
        };
      default:
        return {
          backgroundColor: theme.colors.primary.main,
          color: theme.colors.primary.contrast,
          borderColor: 'transparent'
        };
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const LoadingSpinner = () => (
    <svg
      className={`animate-spin ${iconSizes[size]} ${icon ? '' : '-ml-1 mr-2'}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <span className={iconSizes[size]}>{children}</span>
  );

  const variantStyles = getVariantStyles(variant);

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${className} ${variant === 'secondary' || variant === 'outline' ? 'border' : ''}`}
      style={variantStyles}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && !icon && <LoadingSpinner />}
      {!isLoading && icon && iconPosition === 'left' && <IconWrapper>{icon}</IconWrapper>}
      {children}
      {!isLoading && icon && iconPosition === 'right' && <IconWrapper>{icon}</IconWrapper>}
    </button>
  );
}; 