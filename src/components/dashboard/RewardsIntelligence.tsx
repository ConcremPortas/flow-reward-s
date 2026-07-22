import { Coins, TrendingDown, Layers, Trophy, FlaskConical } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { RewardsIntel } from '@/features/dashboard/types';
import { fmtCurrency, fmtInt } from '@/features/dashboard/utils/format';

interface Props {
  rewards: RewardsIntel;
  className?: string;
}

export function RewardsIntelligence({ rewards, className }: Props) {
  const r = rewards;
  const maxFaixa = Math.max(1, ...r.faixas.map(f => f.total));
  const maxRank = Math.max(1, ...r.ranking.map(x => x.total));
  const perdaTotal = r.potencial - r.projetado;

  const stat = (label: string, value: string, hint?: string) => (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <SectionCard title="Inteligência de Premiações" description="Baseada nos resultados do motor de premiação do domínio" className={className}>
      <div className="space-y-5">
        {/* Totais */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {stat('Potencial', fmtCurrency(r.potencial))}
          {stat('Projetado', fmtCurrency(r.projetado), `${((r.projetado / (r.potencial || 1)) * 100).toFixed(0)}% do potencial`)}
          {stat('Aprovado', '—', 'sem fluxo de aprovação')}
          {stat('Valor médio', fmtCurrency(r.medio))}
          {stat('Elegíveis', fmtInt(r.elegiveis))}
          {stat('Não elegíveis', fmtInt(r.naoElegiveis))}
        </div>

        {/* Waterfall de perdas */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingDown className="h-4 w-4 text-destructive" /> Waterfall — do potencial ao projetado
            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">estimativa</span>
          </div>
          <div className="space-y-1.5">
            {r.waterfall.map(step => {
              const pctW = Math.max(3, (Math.abs(step.value) / (r.potencial || 1)) * 100);
              const color = step.kind === 'base' ? 'bg-primary' : step.kind === 'result' ? 'bg-success' : 'bg-destructive';
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{step.label}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                    <div className={cn('h-full rounded', color)} style={{ width: `${pctW}%` }} />
                  </div>
                  <span className={cn('w-24 shrink-0 text-right text-xs font-medium tabular-nums', step.kind === 'loss' ? 'text-destructive' : 'text-foreground')}>
                    {step.kind === 'loss' ? '−' : ''}{fmtCurrency(Math.abs(step.value))}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Perda total estimada: {fmtCurrency(perdaTotal)} — atribuída por critério proporcional a (1 − nota) das notas persistidas.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Distribuição por faixa */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Layers className="h-4 w-4 text-primary" /> Distribuição por faixa</div>
            {r.faixas.length === 0 ? <p className="text-xs text-muted-foreground">Sem dados.</p> : (
              <div className="space-y-1.5">
                {r.faixas.slice(0, 6).map(f => (
                  <div key={f.faixa}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{f.faixa} <span className="text-muted-foreground/70">({f.count})</span></span>
                      <span className="font-medium text-foreground">{fmtCurrency(f.total)}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(f.total / maxFaixa) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking por setor */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Trophy className="h-4 w-4 text-primary" /> Ranking por setor</div>
            {r.ranking.length === 0 ? <p className="text-xs text-muted-foreground">Sem dados.</p> : (
              <div className="space-y-1.5">
                {r.ranking.map(x => (
                  <div key={x.setor}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{x.setor}</span>
                      <span className="font-medium text-foreground">{fmtCurrency(x.total)}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success" style={{ width: `${(x.total / maxRank) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Simulações */}
        {r.simulacoes.length > 0 && (
          <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <FlaskConical className="h-4 w-4 text-primary" /> Simulações de recuperação
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">cenário</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {r.simulacoes.map(s => (
                <div key={s.key} className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold text-success">+{fmtCurrency(s.recuperavel)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
