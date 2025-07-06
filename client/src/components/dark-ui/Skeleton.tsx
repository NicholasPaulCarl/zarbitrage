import React from 'react';
import { useTheme } from './ThemeContext';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1,
  className = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (variant: string) => {
    const variants = {
      text: {
        borderRadius: '0.25rem',
        height: height || '1rem'
      },
      circular: {
        borderRadius: '50%'
      },
      rectangular: {
        borderRadius: '0'
      },
      rounded: {
        borderRadius: '0.5rem'
      }
    };

    return variants[variant as keyof typeof variants] || variants.rectangular;
  };

  const getAnimationStyles = (animation: string) => {
    if (animation === 'none') return {};
    
    const animations = {
      pulse: {
        animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      wave: {
        animation: 'skeleton-wave 1.6s linear infinite',
        background: `linear-gradient(90deg, ${theme.colors.background.tertiary} 25%, ${theme.colors.background.elevated} 37%, ${theme.colors.background.tertiary} 63%)`
      }
    };

    return animations[animation as keyof typeof animations] || animations.pulse;
  };

  const variantStyles = getVariantStyles(variant);
  const animationStyles = getAnimationStyles(animation);

  const baseSkeletonStyles = {
    backgroundColor: animation === 'wave' ? 'transparent' : theme.colors.background.tertiary,
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '4rem'),
    display: 'block',
    ...variantStyles,
    ...animationStyles
  };

  // If multiple lines for text variant
  if (variant === 'text' && lines > 1) {
    return (
      <div className={className} style={style} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            style={{
              ...baseSkeletonStyles,
              marginBottom: index < lines - 1 ? '0.5rem' : '0',
              width: index === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
        <style>{`
          @keyframes skeleton-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes skeleton-wave {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div
        className={className}
        style={{ ...baseSkeletonStyles, ...style }}
        {...props}
      />
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes skeleton-wave {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
      `}</style>
    </>
  );
};

// Convenience components for common use cases
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="text" {...props} />
);

export const SkeletonCircle: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="circular" {...props} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`p-6 rounded-xl ${className}`}
      style={{ backgroundColor: theme.colors.background.tertiary }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <SkeletonCircle width="3rem" height="3rem" />
        <div className="flex-1">
          <SkeletonText width="60%" height="1.25rem" className="mb-2" />
          <SkeletonText width="40%" height="1rem" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
};