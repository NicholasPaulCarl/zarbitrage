import React from 'react';
import { useTheme } from './ThemeContext';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  spacing = 'md',
  opacity = 1,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();

  const getSpacingStyles = (spacing: string, orientation: string) => {
    const spacings = {
      none: { margin: '0' },
      sm: { 
        margin: orientation === 'horizontal' ? '0.5rem 0' : '0 0.5rem'
      },
      md: { 
        margin: orientation === 'horizontal' ? '1rem 0' : '0 1rem'
      },
      lg: { 
        margin: orientation === 'horizontal' ? '1.5rem 0' : '0 1.5rem'
      },
      xl: { 
        margin: orientation === 'horizontal' ? '2rem 0' : '0 2rem'
      }
    };

    return spacings[spacing as keyof typeof spacings] || spacings.md;
  };

  const spacingStyles = getSpacingStyles(spacing, orientation);

  const separatorStyles = {
    backgroundColor: theme.colors.border.primary,
    opacity: opacity,
    borderStyle: variant,
    ...spacingStyles,
    ...(orientation === 'horizontal' 
      ? { 
          width: '100%', 
          height: variant === 'solid' ? '1px' : '0',
          borderTop: variant !== 'solid' ? `1px ${variant} ${theme.colors.border.primary}` : 'none'
        }
      : { 
          height: '100%', 
          width: variant === 'solid' ? '1px' : '0',
          borderLeft: variant !== 'solid' ? `1px ${variant} ${theme.colors.border.primary}` : 'none'
        })
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={className}
      style={separatorStyles}
      {...props}
    />
  );
};

// Convenience components for common use cases
export const Divider: React.FC<Omit<SeparatorProps, 'orientation'>> = (props) => (
  <Separator orientation="horizontal" {...props} />
);

export const VerticalDivider: React.FC<Omit<SeparatorProps, 'orientation'>> = (props) => (
  <Separator orientation="vertical" {...props} />
);