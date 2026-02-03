'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-accent-200 via-accent-100 to-accent-200 bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-accent-200 p-6 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <SkeletonText lines={2} />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-accent-200 overflow-hidden">
      <div className="bg-accent-50 border-b border-accent-200 px-6 py-3">
        <div className="flex gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="divide-y divide-accent-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-accent-200 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="w-72 flex-shrink-0">
          <Skeleton className="h-10 rounded-t-lg" />
          <div className="bg-accent-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="bg-white p-3 rounded-lg border border-accent-200 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function SkeletonActivityDetail() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard />
          <div className="bg-white rounded-xl border border-accent-200 p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
