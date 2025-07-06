import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from './ThemeContext';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  delay = 500,
  disabled = false,
  className = ''
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

    setPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, placement]);

  const tooltipStyles = {
    position: 'fixed' as const,
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 9999,
    backgroundColor: theme.colors.background.elevated,
    color: theme.colors.text.primary,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${theme.colors.border.primary}`,
    maxWidth: '200px',
    wordWrap: 'break-word' as const,
    opacity: isVisible ? 1 : 0,
    transform: `scale(${isVisible ? 1 : 0.95})`,
    transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
    pointerEvents: 'none' as const
  };

  const arrowStyles = {
    position: 'absolute' as const,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: 'transparent'
  };

  // Arrow positioning based on placement
  const getArrowStyles = () => {
    const baseArrow = { ...arrowStyles };
    
    switch (placement) {
      case 'top':
        return {
          ...baseArrow,
          top: '100%',
          left: '50%',
          marginLeft: '-4px',
          borderTopColor: theme.colors.background.elevated,
          borderBottomWidth: 0
        };
      case 'bottom':
        return {
          ...baseArrow,
          bottom: '100%',
          left: '50%',
          marginLeft: '-4px',
          borderBottomColor: theme.colors.background.elevated,
          borderTopWidth: 0
        };
      case 'left':
        return {
          ...baseArrow,
          left: '100%',
          top: '50%',
          marginTop: '-4px',
          borderLeftColor: theme.colors.background.elevated,
          borderRightWidth: 0
        };
      case 'right':
        return {
          ...baseArrow,
          right: '100%',
          top: '50%',
          marginTop: '-4px',
          borderRightColor: theme.colors.background.elevated,
          borderLeftWidth: 0
        };
      default:
        return baseArrow;
    }
  };

  const clonedChildren = React.cloneElement(children as React.ReactElement, {
    ref: triggerRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip
  });

  return (
    <>
      {clonedChildren}
      {isVisible && content && createPortal(
        <div ref={tooltipRef} style={tooltipStyles} className={className} role="tooltip">
          {content}
          <div style={getArrowStyles()} />
        </div>,
        document.body
      )}
    </>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ 
  children, 
  asChild = false 
}) => {
  if (asChild) {
    return <>{children}</>;
  }
  return <span>{children}</span>;
};

export const TooltipContent: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties; 
}> = ({ children, className = '', style }) => {
  return <div className={className} style={style}>{children}</div>;
};