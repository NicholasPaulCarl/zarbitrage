import React from 'react';
import { useTheme } from './ThemeContext';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glass' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  glowOnHover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  glowOnHover = false,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  
  const baseStyles = `
    rounded-xl
    transition-all duration-300
    ${hoverable ? 'cursor-pointer transform hover:scale-[1.02]' : ''}
    ${glowOnHover ? 'hover:shadow-2xl hover:shadow-red-500/10' : ''}
  `;

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: theme.colors.background.tertiary
        };
      case 'bordered':
        return {
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.primary
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.background.elevated
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          borderColor: 'rgba(55, 65, 81, 0.5)',
          backdropFilter: 'blur(12px)'
        };
      case 'muted':
        return {
          backgroundColor: `${theme.colors.background.tertiary}80`,
          borderColor: theme.colors.border.primary
        };
      default:
        return {
          backgroundColor: theme.colors.background.tertiary
        };
    }
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantStyles = getVariantStyles(variant);
  
  return (
    <div
      className={`${baseStyles} ${paddings[padding]} ${className} ${variant === 'bordered' || variant === 'glass' ? 'border' : ''} ${variant === 'elevated' ? 'shadow-xl' : ''}`}
      style={variantStyles}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  
  // If children are provided, use them directly
  if (children) {
    return (
      <div className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
  
  // Otherwise use the title/subtitle props
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`} {...props}>
      <div>
        {title && (
          <h3 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: theme.colors.text.secondary }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Card Content component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <div className={className} style={{ color: theme.colors.text.primary }} {...props}>
      {children}
    </div>
  );
};

// Card Title component  
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  as: Component = 'h3',
  className = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  
  const titleStyles = {
    fontSize: '1.25rem',
    fontWeight: '600',
    lineHeight: '1.75rem',
    color: theme.colors.text.primary,
    ...style
  };
  
  return (
    <Component className={className} style={titleStyles} {...props}>
      {children}
    </Component>
  );
};

// Card Description component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  
  const descriptionStyles = {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: theme.colors.text.secondary,
    ...style
  };
  
  return (
    <p className={className} style={descriptionStyles} {...props}>
      {children}
    </p>
  );
};

// Card Footer component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  divider = true,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <div
      className={`mt-6 ${divider ? 'pt-4 border-t' : ''} ${className}`}
      style={divider ? { borderColor: theme.colors.border.primary } : {}}
      {...props}
    >
      {children}
    </div>
  );
}; 