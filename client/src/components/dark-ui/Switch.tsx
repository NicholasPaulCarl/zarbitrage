import React from 'react';
import { useTheme } from './ThemeContext';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  variant?: 'default' | 'primary';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  variant = 'primary',
  className = ''
}) => {
  const { theme } = useTheme();

  const getSizeStyles = (size: string) => {
    const sizes = {
      sm: {
        switch: { width: '2.75rem', height: '1.5rem' },
        thumb: { width: '1.125rem', height: '1.125rem' },
        translate: { off: '0.1875rem', on: '1.375rem' }
      },
      md: {
        switch: { width: '3.5rem', height: '1.75rem' },
        thumb: { width: '1.375rem', height: '1.375rem' },
        translate: { off: '0.1875rem', on: '1.9375rem' }
      },
      lg: {
        switch: { width: '4rem', height: '2rem' },
        thumb: { width: '1.5rem', height: '1.5rem' },
        translate: { off: '0.25rem', on: '2.25rem' }
      }
    };

    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getVariantStyles = (variant: string, checked: boolean) => {
    if (variant === 'primary') {
      return {
        background: checked ? theme.colors.primary.main : theme.colors.background.tertiary,
        borderColor: checked ? theme.colors.primary.main : theme.colors.border.primary
      };
    }
    
    return {
      background: checked ? theme.colors.text.primary : theme.colors.background.tertiary,
      borderColor: checked ? theme.colors.text.primary : theme.colors.border.primary
    };
  };

  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant, checked);

  const switchStyles = {
    position: 'relative' as const,
    display: 'inline-flex',
    flexShrink: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '9999px',
    borderWidth: '2px',
    borderStyle: 'solid',
    backgroundColor: variantStyles.background,
    borderColor: variantStyles.borderColor,
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.5 : 1,
    ...sizeStyles.switch
  };

  const thumbStyles = {
    display: 'inline-block',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary.contrast,
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease-in-out',
    transform: `translateX(${checked ? sizeStyles.translate.on : sizeStyles.translate.off})`,
    ...sizeStyles.thumb
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        style={switchStyles}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.outline = `2px solid ${theme.colors.primary.main}`;
            e.currentTarget.style.outlineOffset = '2px';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
      >
        <span style={thumbStyles} />
      </button>
      
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label 
              className="text-sm font-medium cursor-pointer"
              style={{ color: theme.colors.text.primary }}
              onClick={handleClick}
            >
              {label}
            </label>
          )}
          {description && (
            <span 
              className="text-xs mt-1"
              style={{ color: theme.colors.text.secondary }}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};