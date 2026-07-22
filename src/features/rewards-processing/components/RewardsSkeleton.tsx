import { Skeleton } from '@/components/ui/skeleton';

export function RewardsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]" aria-busy="true">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-[420px] rounded-xl lg:col-span-8" />
        <Skeleton className="h-[420px] rounded-xl lg:col-span-4" />
      </div>
    </div>
  );
}
