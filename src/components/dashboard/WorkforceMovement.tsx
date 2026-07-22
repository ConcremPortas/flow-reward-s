import { UserPlus, UserMinus, Users, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import type { WorkforcePoint } from '@/features/dashboard/types';
import { fmtInt } from '@/features/dashboard/utils/format';

interface WorkforceMovementProps {
  point: WorkforcePoint | null;
  className?: string;
}

/** Fluxo de movimentação do mês: inicial → admissões → desligamentos → final. */
export function WorkforceMovement({ point, className }: WorkforceMovementProps) {
  const final = point?.ativos ?? 0;
  const adm = point?.admissoes ?? 0;
  const desl = point?.desligamentos ?? 0;
  const inicial = final - (adm - desl);
  const reconciliado = inicial + adm - desl === final;

  const rows = [
    { label: 'Quadro inicial', value: inicial, icon: Users, tone: 'text-foreground', bar: 'bg-muted-foreground/40' },
    { label: 'Admissões', value: adm, icon: UserPlus, tone: 'text-success', bar: 'bg-success', signed: '+' },
    { label: 'Desligamentos', value: desl, icon: UserMinus, tone: 'text-destructive', bar: 'bg-destructive', signed: '−' },
    { label: 'Quadro final', value: final, icon: Users, tone: 'text-foreground', bar: 'bg-primary' },
  ];
  const max = Math.max(inicial, final, 1);

  return (
    <SectionCard title="Movimentação do Quadro" description="Reconciliação do mês" className={className}>
      {!point ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Sem dados no período.</div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => {
            const Icon = r.icon;
            const w = Math.max(4, (r.value / max) * 100);
            return (
              <div key={r.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className={`h-4 w-4 ${r.tone}`} /> {r.label}
                  </span>
                  <span className={`font-semibold ${r.tone}`}>{r.signed ?? ''}{fmtInt(r.value)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <span>{fmtInt(inicial)}</span><ArrowRight className="h-3 w-3" />
            <span className="text-success">+{fmtInt(adm)}</span><ArrowRight className="h-3 w-3" />
            <span className="text-destructive">−{fmtInt(desl)}</span><ArrowRight className="h-3 w-3" />
            <span className="font-semibold text-foreground">{fmtInt(final)}</span>
            {!reconciliado && <span className="ml-auto text-status-warning">⚠ divergência de dados</span>}
          </div>
          <p className="text-[11px] text-muted-foreground">Transferências entre setores não são registradas no banco — etapas omitidas.</p>
        </div>
      )}
    </SectionCard>
  );
}
