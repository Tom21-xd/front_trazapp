import { Skeleton } from '@/components/ui';

export default function ActivitiesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-accent-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-accent-200">
        <div className="px-6 py-4 border-b border-accent-200">
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="divide-y divide-accent-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
