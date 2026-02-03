import { Skeleton, SkeletonStats, SkeletonCard } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <SkeletonStats />

      <div className="bg-white rounded-xl border border-accent-200">
        <div className="px-6 py-4 border-b border-accent-200 flex justify-between items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-accent-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-accent-200">
        <div className="px-6 py-4 border-b border-accent-200 flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-accent-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
