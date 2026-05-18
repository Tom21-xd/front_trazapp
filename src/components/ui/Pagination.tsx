'use client';

import { cn } from '@/lib/utils';
import type { PageMeta } from '@/types';

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  const { page, totalPages, total, limit } = meta;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const pages = getPages(page, totalPages);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2',
        className,
      )}
    >
      <p className="text-sm text-accent-500">
        Mostrando <span className="font-medium text-accent-700">{from}</span>–
        <span className="font-medium text-accent-700">{to}</span> de{' '}
        <span className="font-medium text-accent-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevPage}
          aria-label="Página anterior"
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-accent-600 bg-white border border-accent-200 hover:bg-accent-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`dots-${i}`}
              className="px-2 text-sm text-accent-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'min-w-9 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                p === page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'text-accent-600 bg-white border-accent-200 hover:bg-accent-50',
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNextPage}
          aria-label="Página siguiente"
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-accent-600 bg-white border border-accent-200 hover:bg-accent-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

Pagination.displayName = 'Pagination';
