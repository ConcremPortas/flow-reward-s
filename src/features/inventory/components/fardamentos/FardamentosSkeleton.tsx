import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton da listagem (linhas), usado enquanto os fardamentos carregam. */
export function FardamentosTableSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="hidden h-10 w-24 lg:block" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}
