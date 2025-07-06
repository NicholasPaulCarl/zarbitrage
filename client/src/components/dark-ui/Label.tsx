import React from 'react';
import { useTheme } from './ThemeContext';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: 'default' | 'secondary' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({
  children,
  variant = 'default',
  size = 'md',
  required = false,
  className = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (variant: string) => {
    const variants = {
      default: {
        color: theme.colors.text.primary
      },
      secondary: {
        color: theme.colors.text.secondary
      },
      muted: {
        color: theme.colors.text.secondary,
        opacity: 0.7
      }
    };
    
    return variants[variant as keyof typeof variants] || variants.default;
  };

  const getSizeStyles = (size: string) => {
    const sizes = {
      sm: {
        fontSize: '0.75rem',
        lineHeight: '1rem'
      },
      md: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem'
      },
      lg: {
        fontSize: '1rem',
        lineHeight: '1.5rem'
      }
    };
    
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  const labelStyles = {
    fontWeight: '500',
    display: 'inline-block',
    cursor: 'pointer',
    ...variantStyles,
    ...sizeStyles,
    ...style
  };

  return (
    <label
      className={className}
      style={labelStyles}
      {...props}
    >
      {children}
      {required && (
        <span 
          style={{ 
            color: theme.colors.status.error,
            marginLeft: '0.25rem'
          }}
        >
          *
        </span>
      )}
    </label>
  );
};