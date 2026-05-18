'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

/** Evento sintético compatible con los call-sites: `onChange={(e) => e.target.value}` */
type SelectChangeEvent = { target: { value: string } };

interface SelectProps {
  id?: string;
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
  value?: string;
  onChange?: (e: SelectChangeEvent) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
}

export function Select({
  id,
  label,
  error,
  options,
  placeholder = 'Selecciona...',
  value,
  onChange,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const fieldId = id || generatedId;

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (val: string) => {
    onChange?.({ target: { value: val } });
    setOpen(false);
  };

  const handleTriggerKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(
          Math.max(0, options.findIndex((o) => o.value === value)),
        );
      } else {
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && open && activeIndex >= 0) {
      e.preventDefault();
      choose(options[activeIndex].value);
    }
  };

  return (
    <div className={cn('w-full', className)} ref={rootRef}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-accent-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={handleTriggerKey}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg border text-left',
            'bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-accent-100',
            error ? 'border-secondary-500 focus:ring-secondary-500' : 'border-accent-300',
          )}
        >
          <span
            className={cn(
              'truncate',
              selected ? 'text-accent-900' : 'text-accent-400',
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={cn(
              'w-4 h-4 text-accent-500 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            ref={listRef}
            role="listbox"
            aria-label={label || placeholder}
            className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-accent-200 rounded-lg shadow-lg py-1 animate-in fade-in duration-150"
          >
            {options.length === 0 && (
              <div className="px-4 py-2 text-sm text-accent-400">
                Sin opciones
              </div>
            )}
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => choose(opt.value)}
                  className={cn(
                    'w-full px-4 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 text-left',
                    isActive ? 'bg-primary-50' : 'hover:bg-accent-50',
                    isSelected ? 'text-primary-700 font-medium' : 'text-accent-700',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-secondary-500">{error}</p>}
    </div>
  );
}

Select.displayName = 'Select';
