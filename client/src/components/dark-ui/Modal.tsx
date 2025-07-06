import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from './ThemeContext';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  footer,
}) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const getBackdropStyles = () => ({
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)'
  });

  const getModalStyles = () => ({
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    pointerEvents: 'none' as const
  });

  const getContentStyles = () => ({
    width: '100%',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: '0.75rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto' as const,
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  });

  const getHeaderStyles = () => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'between',
    padding: '1.5rem',
    borderBottom: `1px solid ${theme.colors.border.primary}`
  });

  const getCloseButtonStyles = () => ({
    marginLeft: 'auto',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    color: theme.colors.text.secondary,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none'
  });

  const CloseIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        style={getBackdropStyles()}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal */}
      <div style={getModalStyles()}>
        <div 
          className={sizes[size]}
          style={getContentStyles()} 
          ref={modalRef}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div style={getHeaderStyles()}>
              {title && (
                <h2 
                  className="text-2xl font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  style={getCloseButtonStyles()}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = theme.colors.text.primary;
                    (e.currentTarget as HTMLElement).style.backgroundColor = theme.colors.background.elevated;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = theme.colors.text.secondary;
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close modal"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ padding: '1.5rem' }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div 
              style={{
                padding: '1.5rem',
                borderTop: `1px solid ${theme.colors.border.primary}`
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
};

// Confirmation Modal variant
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  const { theme } = useTheme();
  
  const variantConfig = {
    danger: {
      icon: '⚠️',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: '⚡',
      buttonVariant: 'primary' as const,
    },
    info: {
      icon: 'ℹ️',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        <div className="text-5xl mb-4">{config.icon}</div>
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ color: theme.colors.text.primary }}
        >
          {title}
        </h3>
        <p 
          className="mb-6"
          style={{ color: theme.colors.text.secondary }}
        >
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};