import { cn } from '@/lib/utils';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import type { MaturidadeResultado, MaturidadeClasse } from '../domain/structureMaturity';

const CLASSE_VARIANT: Record<MaturidadeClasse, StatusVariant> = {
  nao_implantado: 'neutral',
  inicial: 'danger',
  em_estruturacao: 'warning',
  estruturado: 'info',
  maduro: 'success',
};

const BAR_COLOR: Record<MaturidadeClasse, string> = {
  nao_implantado: 'bg-muted-foreground/40',
  inicial: 'bg-destructive',
  em_estruturacao: 'bg-status-warning',
  estruturado: 'bg-primary',
  maduro: 'bg-success',
};

interface Props {
  maturidade: MaturidadeResultado;
}

/** Índice de maturidade (implantação) da estrutura de cargos e remuneração. */
export function MaturityCard({ maturidade }: Props) {
  const { score, classe, classeRotulo, componentes, proximosPassos } = maturidade;
  return (
    <SectionCard
      title="Índice de maturidade da estrutura"
      description="Mede o quanto o plano de cargos e salários está implantado (não é desempenho)."
    >
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/20 p-5 text-center">
          <div className="text-5xl font-bold tracking-tight text-foreground">{formatNumberBR(score)}</div>
          <div className="text-sm text-muted-foreground">de 100</div>
          <div className="mt-3"><StatusBadge variant={CLASSE_VARIANT[classe]}>{classeRotulo}</StatusBadge></div>
        </div>

        <div className="space-y-3">
          {componentes.map((c) => (
            <div key={c.chave} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{c.rotulo}</span>
                <span className="tabular-nums text-muted-foreground">{c.pontos}/{c.peso}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', BAR_COLOR[classe])} style={{ width: `${Math.round(c.proporcao * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{c.detalhe}</p>
            </div>
          ))}
        </div>
      </div>

      {proximosPassos.length > 0 && (
        <div className="mt-5 rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Próximos passos para amadurecer a estrutura</p>
          <ul className="space-y-1.5">
            {proximosPassos.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
