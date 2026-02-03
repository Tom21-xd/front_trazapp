import { Skeleton } from '@/components/ui';

export default function MyTasksLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="bg-white rounded-xl border border-accent-200">
          <div className="px-6 py-4 border-b border-accent-200">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="divide-y divide-accent-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
