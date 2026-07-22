import { ShieldCheck, HardHat, Activity, Ban } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { SectorRow } from '@/features/dashboard/types';
import { METAS } from '@/features/dashboard/metricDefinitions';

interface Props {
  sectors: SectorRow[];
  className?: string;
}

/** Painéis coordenados de DSS, EPI e Afastamentos (indisponível → governança). */
export function SafetyCompliance({ sectors, className }: Props) {
  const comDss = sectors.filter(s => s.dssPct != null);
  const dssMedia = comDss.length ? comDss.reduce((a, s) => a + (s.dssPct as number), 0) / comDss.length : null;
  const dssAbaixo = comDss.filter(s => (s.dssPct as number) < METAS.dssMin).sort((a, b) => (a.dssPct as number) - (b.dssPct as number)).slice(0, 5);

  const epiTotal = sectors.reduce((a, s) => a + s.epiPendencias, 0);
  const epiAfetados = sectors.filter(s => s.epiPendencias > 0).sort((a, b) => b.epiPendencias - a.epiPendencias).slice(0, 5);

  return (
    <SectionCard title="Saúde, Segurança e Conformidade" description="DSS, EPI e afastamentos" className={className} noBodyPadding>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* DSS */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> DSS</div>
          <p className="mt-3 text-3xl font-bold text-foreground">{dssMedia == null ? '—' : `${dssMedia.toFixed(0)}%`}</p>
          <p className="text-xs text-muted-foreground">participação média (meta ≥ {METAS.dssMin}%)</p>
          <p className="mt-4 mb-1.5 text-xs font-medium text-muted-foreground">Setores abaixo da referência</p>
          {dssAbaixo.length === 0 ? <p className="text-xs text-success">Todos dentro da meta.</p> : (
            <ul className="space-y-1.5">
              {dssAbaixo.map(s => (
                <li key={s.setorId} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{s.setor}</span>
                  <span className="font-medium text-destructive">{(s.dssPct as number).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* EPI */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><HardHat className="h-4 w-4 text-primary" /> EPI</div>
          <p className="mt-3 text-3xl font-bold text-foreground">{epiTotal}</p>
          <p className="text-xs text-muted-foreground">não conformidades no período</p>
          <p className="mt-4 mb-1.5 text-xs font-medium text-muted-foreground">Setores com mais pendências</p>
          {epiAfetados.length === 0 ? <p className="text-xs text-success">Sem pendências.</p> : (
            <ul className="space-y-1.5">
              {epiAfetados.map(s => (
                <li key={s.setorId} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{s.setor}</span>
                  <span className="font-medium text-status-warning">{s.epiPendencias}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">Vencidas / tempo de resolução exigem histórico de status (ver Qualidade de Dados).</p>
        </div>

        {/* Afastamentos */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="h-4 w-4 text-primary" /> Afastamentos</div>
          <div className={cn('mt-3 flex flex-col items-start gap-1 rounded-lg border border-dashed border-border bg-muted/20 p-4')}>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Ban className="h-4 w-4" /> Dado indisponível</span>
            <p className="text-xs text-muted-foreground">Não há tabela de afastamentos (atestados/INSS). Ativos, dias perdidos e retorno previsto requerem cadastro no módulo SESMT/RH.</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
