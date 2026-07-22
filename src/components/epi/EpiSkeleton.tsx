import { Skeleton } from '@/components/ui/skeleton';

export function EpiSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Skeleton className="h-96 w-full rounded-xl xl:col-span-8" />
        <Skeleton className="h-96 w-full rounded-xl xl:col-span-4" />
      </div>
    </div>
  );
}
