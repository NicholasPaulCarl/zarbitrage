import React from 'react';
import { useTheme } from './ThemeContext';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animate?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  animate = true,
  className = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  
  const percentage = Math.min((value / max) * 100, 100);

  const getVariantColor = (variant: string) => {
    const variants = {
      default: theme.colors.primary.main,
      success: theme.colors.status.success,
      warning: theme.colors.status.warning,
      error: theme.colors.status.error
    };
    
    return variants[variant as keyof typeof variants] || variants.default;
  };

  const getSizeStyles = (size: string) => {
    const sizes = {
      sm: { height: '0.5rem' },
      md: { height: '1rem' },
      lg: { height: '1.5rem' }
    };
    
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const sizeStyles = getSizeStyles(size);
  const progressColor = getVariantColor(variant);

  const containerStyles = {
    position: 'relative' as const,
    width: '100%',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: '9999px',
    overflow: 'hidden',
    ...sizeStyles,
    ...style
  };

  const barStyles = {
    height: '100%',
    backgroundColor: progressColor,
    borderRadius: '9999px',
    width: `${percentage}%`,
    transition: animate ? 'all 0.3s ease-out' : 'none',
    transform: 'translateZ(0)' // Hardware acceleration
  };

  const labelStyles = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
    fontWeight: '600',
    color: percentage > 50 ? 'white' : theme.colors.text.primary,
    lineHeight: 1
  };

  return (
    <div
      className={className}
      style={containerStyles}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${Math.round(percentage)}%`}
      {...props}
    >
      <div style={barStyles}>
        {animate && (
          <style>{`
            @keyframes progress-shine {
              0% {
                background-position: -200px 0;
              }
              100% {
                background-position: calc(200px + 100%) 0;
              }
            }
            
            .progress-shine {
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              );
              background-size: 200px 100%;
              animation: progress-shine 2s infinite;
            }
          `}</style>
        )}
      </div>
      
      {showValue && (
        <div style={labelStyles}>
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Circular progress variant
export interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  animate?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  animate = true
}) => {
  const { theme } = useTheme();
  
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getVariantColor = (variant: string) => {
    const variants = {
      default: theme.colors.primary.main,
      success: theme.colors.status.success,
      warning: theme.colors.status.warning,
      error: theme.colors.status.error
    };
    
    return variants[variant as keyof typeof variants] || variants.default;
  };

  const progressColor = getVariantColor(variant);

  return (
    <div 
      style={{ 
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.background.tertiary}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: animate ? 'stroke-dashoffset 0.5s ease-out' : 'none'
          }}
        />
      </svg>
      
      {showValue && (
        <div
          style={{
            position: 'absolute',
            fontSize: size > 100 ? '1.25rem' : '1rem',
            fontWeight: '600',
            color: theme.colors.text.primary
          }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};