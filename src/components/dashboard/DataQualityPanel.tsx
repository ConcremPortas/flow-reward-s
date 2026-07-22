import { Database, CheckCircle2, Calculator, CircleDashed, Ban } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import { formatDateTimeBR } from '@/lib/dateTime';
import type { DataQuality, DataStatus } from '@/features/dashboard/types';

const META: Record<DataStatus, { label: string; icon: typeof Ban; tint: string }> = {
  disponivel: { label: 'Disponível', icon: CheckCircle2, tint: 'text-success bg-success/10' },
  calculavel: { label: 'Calculável', icon: Calculator, tint: 'text-primary bg-primary/10' },
  parcial: { label: 'Parcial', icon: CircleDashed, tint: 'text-status-warning bg-status-warning/10' },
  indisponivel: { label: 'Indisponível', icon: Ban, tint: 'text-muted-foreground bg-muted' },
};

interface DataQualityPanelProps {
  quality: DataQuality;
  lastUpdated: Date | null;
}

/** Governança: cobertura das fontes; dados ausentes viram informação, não buraco de layout. */
export function DataQualityPanel({ quality, lastUpdated }: DataQualityPanelProps) {
  const updated = lastUpdated ? formatDateTimeBR(lastUpdated) : '—';
  return (
    <SectionCard
      title="Qualidade e Cobertura dos Dados"
      description={`Cobertura de ${quality.coberturaPct}% das métricas · última atualização ${updated}`}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quality.sources.map(s => {
          const m = META[s.status];
          const Icon = m.icon;
          return (
            <div key={s.key} className="flex items-start gap-2.5 rounded-lg border border-border/70 p-3">
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', m.tint)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
                  <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium', m.tint)}>{m.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        Métricas sem fonte (afastamentos, horas extras, turno) ficam aqui — não ocupam os KPIs principais.
      </div>
    </SectionCard>
  );
}
