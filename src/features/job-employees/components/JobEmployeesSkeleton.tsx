/** Esqueleto de carregamento da Central de Enquadramento. */
export function JobEmployeesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="h-11 w-80 animate-pulse rounded-xl bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
      </div>
      <div className="h-[28rem] w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
