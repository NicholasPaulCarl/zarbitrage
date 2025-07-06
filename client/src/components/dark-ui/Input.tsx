import React, { useState, forwardRef } from 'react';
import { useTheme } from './ThemeContext';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'unstyled';
  floatingLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  variant = 'default',
  floatingLabel = true,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const baseInputStyles = `
    w-full px-4 py-3
    bg-transparent
    rounded-lg
    transition-all duration-300
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${icon && iconPosition === 'left' ? 'pl-12' : ''}
    ${icon && iconPosition === 'right' ? 'pr-12' : ''}
    ${floatingLabel && label ? 'pt-6 pb-2' : ''}
  `;

  const getVariantStyles = (variant: string) => {
    const baseVariant = {
      borderWidth: '2px',
      borderStyle: 'solid'
    };
    
    switch (variant) {
      case 'default':
        return {
          ...baseVariant,
          borderColor: error ? theme.colors.status.error : theme.colors.border.primary,
          backgroundColor: 'transparent',
          color: theme.colors.text.primary
        };
      case 'filled':
        return {
          ...baseVariant,
          borderColor: error ? theme.colors.status.error : 'transparent',
          backgroundColor: theme.colors.background.tertiary,
          color: theme.colors.text.primary
        };
      case 'unstyled':
        return {
          color: theme.colors.text.primary
        };
      default:
        return {
          ...baseVariant,
          borderColor: error ? theme.colors.status.error : theme.colors.border.primary,
          backgroundColor: 'transparent',
          color: theme.colors.text.primary
        };
    }
  };

  const getLabelStyles = () => {
    if (floatingLabel) {
      return {
        position: 'absolute' as const,
        left: icon && iconPosition === 'left' ? '3rem' : '1rem',
        top: isFocused || hasValue ? '0.5rem' : '1rem',
        fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
        color: error ? theme.colors.status.error : 
               (isFocused || hasValue) ? theme.colors.text.secondary : theme.colors.text.tertiary,
        transition: 'all 0.3s',
        pointerEvents: 'none' as const
      };
    }
    return {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: theme.colors.text.primary
    };
  };

  const getIconStyles = () => ({
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    left: iconPosition === 'left' ? '1rem' : undefined,
    right: iconPosition === 'right' ? '1rem' : undefined,
    color: theme.colors.text.secondary,
    pointerEvents: 'none' as const,
    marginTop: floatingLabel && label ? '0.25rem' : '0'
  });

  return (
    <div className="relative">
      {label && !floatingLabel && (
        <label style={getLabelStyles()}>{label}</label>
      )}
      
      <div className="relative">
        {icon && (
          <div style={getIconStyles()}>
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`${baseInputStyles} ${className}`}
          style={getVariantStyles(variant)}
          placeholder={props.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {label && floatingLabel && (
          <label style={getLabelStyles()}>{label}</label>
        )}
      </div>
      
      {(error || hint) && (
        <div 
          className="mt-2 text-sm"
          style={{
            color: error ? theme.colors.status.error : theme.colors.text.secondary
          }}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component with similar styling
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'filled' | 'unstyled';
  floatingLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  variant = 'default',
  floatingLabel = true,
  className = '',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const baseTextareaStyles = `
    w-full px-4 py-3
    bg-transparent
    rounded-lg
    transition-all duration-300
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    resize-none
    ${floatingLabel && label ? 'pt-6 pb-2' : ''}
  `;

  const getVariantStyles = (variant: string) => {
    const baseVariant = {
      borderWidth: '2px',
      borderStyle: 'solid'
    };
    
    switch (variant) {
      case 'default':
        return {
          ...baseVariant,
          borderColor: error ? theme.colors.status.error : theme.colors.border.primary,
          backgroundColor: 'transparent',
          color: theme.colors.text.primary
        };
      case 'filled':
        return {
          ...baseVariant,
          borderColor: error ? theme.colors.status.error : 'transparent',
          backgroundColor: theme.colors.background.tertiary,
          color: theme.colors.text.primary
        };
      case 'unstyled':
        return {
          color: theme.colors.text.primary
        };
      default:
        return {
          ...baseVariant,
          borderColor: error ? theme.colors.status.error : theme.colors.border.primary,
          backgroundColor: 'transparent',
          color: theme.colors.text.primary
        };
    }
  };

  const getLabelStyles = () => {
    if (floatingLabel) {
      return {
        position: 'absolute' as const,
        left: '1rem',
        top: isFocused || hasValue ? '0.5rem' : '1rem',
        fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
        color: error ? theme.colors.status.error : 
               (isFocused || hasValue) ? theme.colors.text.secondary : theme.colors.text.tertiary,
        transition: 'all 0.3s',
        pointerEvents: 'none' as const
      };
    }
    return {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: theme.colors.text.primary
    };
  };

  return (
    <div className="relative">
      {label && !floatingLabel && (
        <label style={getLabelStyles()}>{label}</label>
      )}
      
      <div className="relative">
        <textarea
          ref={ref}
          className={`${baseTextareaStyles} ${className}`}
          style={getVariantStyles(variant)}
          placeholder={props.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {label && floatingLabel && (
          <label style={getLabelStyles()}>{label}</label>
        )}
      </div>
      
      {(error || hint) && (
        <div 
          className="mt-2 text-sm"
          style={{
            color: error ? theme.colors.status.error : theme.colors.text.secondary
          }}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';