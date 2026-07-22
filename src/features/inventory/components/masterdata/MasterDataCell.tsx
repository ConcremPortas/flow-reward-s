/** Célula de tabela composta: linha principal + subtexto opcional. */
export function Cell2({ main, sub, mono }: { main: string; sub?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`truncate font-medium text-foreground${mono ? ' font-mono text-xs' : ''}`}>{main}</div>
      {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
