import { Skeleton, SkeletonStats, SkeletonKanban } from '@/components/ui';

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <SkeletonStats />

      <div className="bg-white rounded-xl border border-accent-200">
        <div className="px-6 py-4 border-b border-accent-200 flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <SkeletonKanban />
      </div>
    </div>
  );
}
