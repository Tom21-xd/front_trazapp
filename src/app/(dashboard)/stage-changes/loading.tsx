import { Skeleton } from '@/components/ui';

export default function StageChangesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-accent-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-6 w-24 rounded" />
                  </div>
                  <Skeleton className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-6 w-24 rounded" />
                  </div>
                </div>
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
