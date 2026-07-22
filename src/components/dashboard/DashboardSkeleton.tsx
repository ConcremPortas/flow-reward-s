import { Skeleton } from '@/components/ui/skeleton';

/** Estado de carregamento da Central Analítica de RH. */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6" aria-busy="true">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}
