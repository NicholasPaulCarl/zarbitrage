import React, { createContext, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from './ThemeContext';

interface SheetContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextType | null>(null);

const useSheet = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet compound components must be used within a Sheet');
  }
  return context;
};

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  children
}) => {
  const sheetContext = {
    open,
    onOpenChange
  };

  return (
    <SheetContext.Provider value={sheetContext}>
      {children}
    </SheetContext.Provider>
  );
};

export interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SheetTrigger: React.FC<SheetTriggerProps> = ({
  children,
  asChild = false,
  onClick,
  ...props
}) => {
  const { onOpenChange } = useSheet();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(true);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: handleClick
    });
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
};

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const SheetContent: React.FC<SheetContentProps> = ({
  children,
  side = 'right',
  size = 'md',
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  const { open, onOpenChange } = useSheet();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const getSizeStyles = (size: string, side: string) => {
    const isHorizontal = side === 'left' || side === 'right';
    
    const sizes = {
      sm: isHorizontal ? { width: '20rem' } : { height: '20rem' },
      md: isHorizontal ? { width: '24rem' } : { height: '24rem' },
      lg: isHorizontal ? { width: '32rem' } : { height: '32rem' },
      xl: isHorizontal ? { width: '48rem' } : { height: '48rem' },
      full: isHorizontal ? { width: '100vw' } : { height: '100vh' }
    };

    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getPositionStyles = (side: string) => {
    const positions = {
      left: { left: 0, top: 0, bottom: 0 },
      right: { right: 0, top: 0, bottom: 0 },
      top: { top: 0, left: 0, right: 0 },
      bottom: { bottom: 0, left: 0, right: 0 }
    };

    return positions[side as keyof typeof positions] || positions.right;
  };

  const sizeStyles = getSizeStyles(size, side);
  const positionStyles = getPositionStyles(side);

  const overlayStyles = {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)'
  };

  const contentStyles = {
    position: 'fixed' as const,
    zIndex: 1001,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.primary,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: '100vh',
    overflowY: 'auto' as const,
    ...positionStyles,
    ...sizeStyles,
    ...(side === 'left' || side === 'right' 
      ? { borderRightWidth: side === 'left' ? '1px' : '0', borderLeftWidth: side === 'right' ? '1px' : '0' }
      : { borderTopWidth: side === 'bottom' ? '1px' : '0', borderBottomWidth: side === 'top' ? '1px' : '0' }
    ),
    borderStyle: 'solid'
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={overlayStyles}
        onClick={() => onOpenChange(false)}
      />
      
      {/* Content */}
      <div
        ref={contentRef}
        className={className}
        style={contentStyles}
        {...props}
      >
        {children}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slideInTop {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes slideInBottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        [data-sheet-content] {
          animation: ${side === 'right' ? 'slideInRight' : 
                       side === 'left' ? 'slideInLeft' :
                       side === 'top' ? 'slideInTop' : 'slideInBottom'} 0.3s ease-out;
        }
      `}</style>
    </>,
    document.body
  );
};