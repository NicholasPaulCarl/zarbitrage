import React from 'react';
import { useTheme } from './ThemeContext';

export interface AvatarProps {
  className?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  className = '', 
  children, 
  size = 'md' 
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div 
      className={`relative flex shrink-0 overflow-hidden rounded-full ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: theme.colors.background.elevated,
        border: `1px solid ${theme.colors.border.primary}`
      }}
    >
      {children}
    </div>
  );
};

export const AvatarImage: React.FC<AvatarImageProps> = ({ 
  src, 
  alt = '', 
  className = '' 
}) => {
  if (!src) return null;
  
  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className}`}
      src={src}
      alt={alt}
    />
  );
};

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ 
  children, 
  className = '' 
}) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`flex h-full w-full items-center justify-center rounded-full font-medium ${className}`}
      style={{
        backgroundColor: `${theme.colors.primary.main}15`,
        color: theme.colors.primary.main
      }}
    >
      {children}
    </div>
  );
};