import { Skeleton } from '@/components/ui/skeleton';

/** Estado de carregamento da Central de Gestão de Pessoas. */
export function EmployeesSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
