import { useNavigate } from 'react-router-dom';
import { CheckCircle2, PackagePlus, SlidersHorizontal } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumberBR } from '@/lib/formatters';
import type { DashboardData } from './derive';

const CLASSE: Record<string, { label: string; variant: StatusVariant }> = {
  SEM_ESTOQUE: { label: 'Sem estoque', variant: 'danger' },
  CRITICO: { label: 'Crítico', variant: 'danger' },
  ABAIXO_MIN: { label: 'Abaixo do mínimo', variant: 'warning' },
  SEM_MINIMO: { label: 'Sem mínimo', variant: 'neutral' },
};

interface Props {
  alertas: DashboardData['alertas'];
  loading: boolean;
  onOpenItem: (varianteId: string, aba?: string) => void;
}

export function InventoryPriorityAlerts({ alertas, loading, onOpenItem }: Props) {
  const navigate = useNavigate();
  const lista = alertas.slice(0, 8);

  return (
    <SectionCard title="Alertas prioritários" description="Itens que exigem ação, por gravidade.">
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-7 w-7 text-success" />
          <p className="text-sm font-medium text-foreground">Estoque saudável</p>
          <p className="text-xs text-muted-foreground">Nenhum item exige ação no escopo atual.</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <ul className="space-y-2">
            {lista.map(({ linha, classe, minimo, diff }) => {
              const c = CLASSE[classe];
              return (
                <li key={linha.f.variante.id} className="rounded-lg border border-border/60 p-2.5">
                  <button type="button" onClick={() => onOpenItem(linha.f.variante.id)} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label={`Detalhes de ${linha.f.variante.nome}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{linha.f.variante.nome}</div>
                        <div className="truncate font-mono text-xs text-muted-foreground">{linha.f.variante.codigo_interno}</div>
                      </div>
                      <StatusBadge variant={c.variant}>{c.label}</StatusBadge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>Saldo <span className="font-medium text-foreground tabular-nums">{formatNumberBR(linha.saldoTotal)}</span></span>
                      {minimo > 0 && <span>Mín. <span className="tabular-nums">{formatNumberBR(minimo)}</span></span>}
                      {minimo > 0 && <span className={diff < 0 ? 'text-destructive' : 'text-muted-foreground'}>Dif. <span className="tabular-nums">{diff > 0 ? '+' : ''}{formatNumberBR(diff)}</span></span>}
                    </div>
                  </button>
                  <div className="mt-2 flex items-center gap-1.5">
                    <AcaoBtn tip="Registrar entrada" onClick={() => navigate('/controle-estoque/entradas')}><PackagePlus className="h-3.5 w-3.5" /></AcaoBtn>
                    <AcaoBtn tip="Ajustar saldo" onClick={() => navigate('/controle-estoque/ajuste')}><SlidersHorizontal className="h-3.5 w-3.5" /></AcaoBtn>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onOpenItem(linha.f.variante.id, 'movimentacoes')}>Histórico</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      )}
    </SectionCard>
  );
}

function AcaoBtn({ tip, onClick, children }: { tip: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={onClick} aria-label={tip}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
