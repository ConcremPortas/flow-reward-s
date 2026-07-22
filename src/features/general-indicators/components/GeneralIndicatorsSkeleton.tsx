import { Skeleton } from '@/components/ui/skeleton';

export function GeneralIndicatorsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Skeleton className="h-[360px] rounded-xl xl:col-span-8" />
        <Skeleton className="h-[360px] rounded-xl xl:col-span-4" />
      </div>
    </div>
  );
}
