import { Skeleton } from '@/components/ui/skeleton';

export function SectorIndicatorsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-[480px] w-full rounded-xl" />
    </div>
  );
}
