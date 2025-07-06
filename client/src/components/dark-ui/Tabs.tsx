import React, { createContext, useContext, useState } from 'react';
import { useTheme } from './ThemeContext';

// Tabs Context
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
};

// Tabs Root Component
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue = {
    value,
    onValueChange: handleValueChange
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div 
        className={className}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tabs List Component
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  loop?: boolean;
}

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = '',
  loop = true,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  
  const listStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.5rem',
    backgroundColor: theme.colors.background.tertiary,
    padding: '0.25rem',
    border: `1px solid ${theme.colors.border.primary}`,
    ...style
  };

  return (
    <div
      className={className}
      style={listStyles}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
};

// Tabs Trigger Component
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  asChild?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  value: triggerValue,
  className = '',
  style,
  disabled = false,
  ...props
}) => {
  const { theme } = useTheme();
  const { value, onValueChange } = useTabs();
  
  const isSelected = value === triggerValue;
  
  const triggerStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap' as const,
    borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    backgroundColor: isSelected ? theme.colors.background.primary : 'transparent',
    color: isSelected ? theme.colors.text.primary : theme.colors.text.secondary,
    boxShadow: isSelected ? `0 1px 3px rgba(0, 0, 0, 0.1)` : 'none',
    ...style
  };

  const handleClick = () => {
    if (!disabled) {
      onValueChange(triggerValue);
    }
  };

  return (
    <button
      className={className}
      style={triggerStyles}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${triggerValue}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Tabs Content Component
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  children,
  value: contentValue,
  forceMount = false,
  className = '',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const { value } = useTabs();
  
  const isSelected = value === contentValue;
  
  if (!isSelected && !forceMount) {
    return null;
  }

  const contentStyles = {
    marginTop: '0.5rem',
    outline: 'none',
    color: theme.colors.text.primary,
    ...style
  };

  return (
    <div
      className={className}
      style={contentStyles}
      role="tabpanel"
      id={`panel-${contentValue}`}
      aria-labelledby={`tab-${contentValue}`}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
};