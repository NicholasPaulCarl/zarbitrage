import React from 'react';
import { useTheme } from './ThemeContext';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
}

export interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  const { theme } = useTheme();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          backgroundColor: `${theme.colors.status.error}10`,
          borderColor: `${theme.colors.status.error}30`,
          color: theme.colors.status.error
        };
      case 'success':
        return {
          backgroundColor: `${theme.colors.status.success}10`,
          borderColor: `${theme.colors.status.success}30`,
          color: theme.colors.status.success
        };
      case 'warning':
        return {
          backgroundColor: `${theme.colors.status.warning}10`,
          borderColor: `${theme.colors.status.warning}30`,
          color: theme.colors.status.warning
        };
      default:
        return {
          backgroundColor: `${theme.colors.primary.main}10`,
          borderColor: `${theme.colors.primary.main}30`,
          color: theme.colors.text.primary
        };
    }
  };

  return (
    <div 
      className={`relative w-full rounded-lg border p-4 ${className}`}
      style={getVariantStyles()}
    >
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<AlertTitleProps> = ({ 
  children, 
  className = '' 
}) => {
  const { theme } = useTheme();
  
  return (
    <h5 
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      style={{ color: theme.colors.text.primary }}
    >
      {children}
    </h5>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '' 
}) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`text-sm ${className}`}
      style={{ color: theme.colors.text.secondary }}
    >
      {children}
    </div>
  );
};