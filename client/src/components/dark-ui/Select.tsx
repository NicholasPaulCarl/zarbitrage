import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { useTheme } from './ThemeContext';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  variant?: 'default' | 'filled';
  multiple?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  hint,
  disabled = false,
  variant = 'default',
  multiple = false,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (!disabled) {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      if (!multiple) {
        setIsOpen(false);
      }
    }
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const baseStyles = `
    relative w-full px-4 py-3
    rounded-lg
    transition-all duration-300
    cursor-pointer
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-between
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
          backgroundColor: 'transparent',
          borderColor: error ? theme.colors.status.error : 
                      isOpen ? theme.colors.primary.main : theme.colors.border.primary
        };
      case 'filled':
        return {
          ...baseVariant,
          backgroundColor: isOpen ? theme.colors.background.elevated : theme.colors.background.tertiary,
          borderColor: error ? theme.colors.status.error : 
                      isOpen ? theme.colors.primary.main : 'transparent'
        };
      default:
        return {
          ...baseVariant,
          backgroundColor: 'transparent',
          borderColor: error ? theme.colors.status.error : 
                      isOpen ? theme.colors.primary.main : theme.colors.border.primary
        };
    }
  };

  const getDropdownStyles = () => ({
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.5rem',
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.primary,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    zIndex: 50,
    maxHeight: '15rem',
    overflowY: 'auto' as const
  });

  const getOptionStyles = (option: SelectOption) => ({
    padding: '0.75rem 1rem',
    cursor: option.disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    backgroundColor: option.value === selectedValue ? 
      `${theme.colors.primary.main}20` : 'transparent',
    color: theme.colors.text.primary,
    opacity: option.disabled ? 0.5 : 1
  });

  const ChevronIcon = () => (
    <svg
      className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label 
          className="block mb-2 text-sm font-medium"
          style={{ color: theme.colors.text.primary }}
        >
          {label}
        </label>
      )}
      
      <div
        className={baseStyles}
        style={getVariantStyles(variant)}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
      >
        <span 
          style={{
            color: selectedOption ? theme.colors.text.primary : theme.colors.text.tertiary
          }}
        >
          {selectedOption?.label || placeholder}
        </span>
        <div style={{ color: theme.colors.text.secondary }}>
          <ChevronIcon />
        </div>
      </div>

      {isOpen && (
        <div style={getDropdownStyles()}>
          {options.map((option) => (
            <div
              key={option.value}
              style={getOptionStyles(option)}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onMouseEnter={(e) => {
                if (!option.disabled) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = theme.colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (!option.disabled) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 
                    option.value === selectedValue ? `${theme.colors.primary.main}20` : 'transparent';
                }
              }}
              role="option"
              aria-selected={option.value === selectedValue}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

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
};

// Additional Select components for compatibility with shadcn pattern

// Select Context for compound components
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

// SelectRoot component (acts as the main Select)
interface SelectRootProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const SelectRoot: React.FC<SelectRootProps> = ({ value = '', onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{
      value,
      onValueChange: onValueChange || (() => {}),
      open,
      setOpen
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// SelectTrigger component
interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const context = useContext(SelectContext);
  const { theme } = useTheme();
  
  if (!context) {
    throw new Error('SelectTrigger must be used within SelectRoot');
  }
  
  const { open, setOpen } = context;
  
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm ${className}`}
      style={{
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.border.primary,
        color: theme.colors.text.primary
      }}
    >
      {children}
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

// SelectValue component
interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder = 'Select...' }) => {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectValue must be used within SelectRoot');
  }
  
  const { value } = context;
  
  return <span>{value || placeholder}</span>;
};

// SelectContent component
interface SelectContentProps {
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const context = useContext(SelectContext);
  const { theme } = useTheme();
  
  if (!context) {
    throw new Error('SelectContent must be used within SelectRoot');
  }
  
  const { open, setOpen } = context;
  
  if (!open) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 z-50" 
        onClick={() => setOpen(false)}
      />
      <div
        className="absolute z-50 w-full mt-1 rounded-md border shadow-lg"
        style={{
          backgroundColor: theme.colors.background.elevated,
          borderColor: theme.colors.border.primary
        }}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    </>
  );
};

// SelectItem component
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const context = useContext(SelectContext);
  const { theme } = useTheme();
  
  if (!context) {
    throw new Error('SelectItem must be used within SelectRoot');
  }
  
  const { value: selectedValue, onValueChange, setOpen } = context;
  
  const handleSelect = () => {
    onValueChange(value);
    setOpen(false);
  };
  
  return (
    <div
      onClick={handleSelect}
      className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
      style={{
        backgroundColor: selectedValue === value ? theme.colors.primary.main + '20' : 'transparent',
        color: theme.colors.text.primary
      }}
    >
      {children}
    </div>
  );
};