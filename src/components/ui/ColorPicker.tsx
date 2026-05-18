'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value?: string;
  onChange: (hex: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

// Paleta institucional + colores de uso común para etapas/etiquetas
const PALETTE = [
  '#00923f', '#008438', '#22c55e', '#10b981', '#14b8a6', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#ef4444', '#ce1126', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#64748b', '#475569', '#0f172a', '#737373', '#a3a3a3', '#1f2937',
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function ColorPicker({
  value = '#00923f',
  onChange,
  label,
  className,
  disabled,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

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

  const pick = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const onHexInput = (raw: string) => {
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    setHexDraft(next);
    if (HEX_RE.test(next)) onChange(next);
  };

  return (
    <div className={cn('relative inline-block', className)} ref={rootRef}>
      {label && (
        <span className="block text-sm font-medium text-accent-700 mb-1">
          {label}
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-label={`Color seleccionado ${value}. Cambiar color`}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-accent-300 bg-white hover:bg-accent-50 transition-colors disabled:opacity-50"
      >
        <span
          className="w-6 h-6 rounded-md border border-black/10 shrink-0"
          style={{ backgroundColor: value }}
        />
        <span className="hidden sm:inline text-xs text-accent-600 font-mono uppercase">
          {value}
        </span>
        <svg
          className={cn(
            'w-4 h-4 text-accent-400 transition-transform',
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
          className="absolute right-0 mt-2 z-50 w-64 max-w-[calc(100vw-2rem)] p-4 bg-white border border-accent-200 rounded-xl shadow-xl"
          role="dialog"
          aria-label="Selector de color"
        >
          <p className="text-xs font-semibold text-accent-500 uppercase tracking-wide mb-2">
            Elige un color
          </p>
          <div className="grid grid-cols-6 gap-2">
            {PALETTE.map((color) => {
              const isSelected =
                color.toLowerCase() === (value || '').toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => pick(color)}
                  aria-label={`Elegir color ${color}`}
                  title={color}
                  className={cn(
                    'relative w-7 h-7 rounded-lg border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-400',
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-primary-500 border-transparent'
                      : 'border-black/10',
                  )}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <svg
                      className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-accent-200">
            <label className="block text-xs font-medium text-accent-500 mb-1">
              Color personalizado (HEX)
            </label>
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-lg border border-black/10 shrink-0"
                style={{
                  backgroundColor: HEX_RE.test(hexDraft) ? hexDraft : '#ffffff',
                }}
              />
              <input
                type="text"
                value={hexDraft}
                onChange={(e) => onHexInput(e.target.value.trim())}
                placeholder="#00923f"
                maxLength={7}
                spellCheck={false}
                className={cn(
                  'flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-primary-500',
                  HEX_RE.test(hexDraft)
                    ? 'border-accent-300'
                    : 'border-secondary-400',
                )}
              />
            </div>
            {!HEX_RE.test(hexDraft) && (
              <p className="mt-1 text-xs text-secondary-500">
                Formato inválido. Ej: #00923f
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ColorPicker.displayName = 'ColorPicker';
