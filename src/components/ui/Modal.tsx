'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-safe pb-safe overflow-y-auto">
      <div
        className="fixed inset-0 bg-accent-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl w-full max-h-[90dvh] flex flex-col my-auto ring-1 ring-accent-200/60',
          sizes[size],
        )}
      >
        {(title || icon) && (
          <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-accent-100 shrink-0">
            {icon && (
              <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-accent-900 leading-tight"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-accent-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 p-1.5 rounded-lg text-accent-500 hover:bg-accent-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-6 sm:pb-8 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          // Móvil: botones apilados (con el principal arriba por `flex-col-reverse`) y a ancho completo
          // para mejor tap target; sm+: alineados a la derecha en horizontal.
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-accent-100 bg-accent-50/60 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 shrink-0 [&>button]:w-full sm:[&>button]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
