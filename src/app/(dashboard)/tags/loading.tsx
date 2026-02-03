import { Skeleton } from '@/components/ui';

export default function TagsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="bg-white rounded-xl border border-accent-200">
        <div className="px-6 py-4 border-b border-accent-200">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="divide-y divide-accent-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
