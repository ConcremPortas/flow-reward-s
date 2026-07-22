import { Skeleton } from '@/components/ui/skeleton';

export function RewardsReportSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  );
}
