/** Esqueleto de carregamento da Central de Cargos e Remuneração. */
export function JobsSalariesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-11 w-72 animate-pulse rounded-xl bg-muted" />
      <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
