import { SkeletonActivityDetail } from '@/components/ui';

export default function ActivityDetailLoading() {
  return (
    <div className="animate-in fade-in duration-500">
      <SkeletonActivityDetail />
    </div>
  );
}
