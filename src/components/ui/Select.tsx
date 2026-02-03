'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-accent-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2 rounded-lg border border-accent-300',
            'bg-white text-accent-900',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-accent-100',
            error && 'border-secondary-500 focus:ring-secondary-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-secondary-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
