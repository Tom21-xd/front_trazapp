'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-accent-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2 rounded-lg border border-accent-300',
            'bg-white text-accent-900 placeholder:text-accent-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-accent-100',
            error && 'border-secondary-500 focus:ring-secondary-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-secondary-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
