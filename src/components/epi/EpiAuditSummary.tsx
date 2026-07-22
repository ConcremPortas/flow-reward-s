import { Users, ClipboardList, Building2, Calendar, Gauge, AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';

interface Props {
  ativosCount: number;
  setoresCount: number;
  ultimaAuditoria: EpiAuditGroupEnriched | null;
}

/** Resumo da Etapa 1 — só dados realmente disponíveis (auditoria é sempre geral, sem escopo). */
export function EpiAuditSummary({ ativosCount, setoresCount, ultimaAuditoria }: Props) {
  return (
    <SectionCard title="Resumo da Auditoria" description="Auditoria geral — abrange todos os funcionários ativos" className="h-full">
      <div className="space-y-3">
        <Row icon={Users} label="Funcionários ativos" value={String(ativosCount)} />
        <Row icon={ClipboardList} label="Quantidade a auditar" value={String(ativosCount)} />
        <Row icon={Building2} label="Setores" value={String(setoresCount)} />

        {ultimaAuditoria ? (
          <>
            <Row
              icon={Calendar}
              label="Última auditoria"
              value={formatDateBR(ultimaAuditoria.data)}
            />
            <Row
              icon={Gauge}
              label="Conformidade anterior"
              value={ultimaAuditoria.taxaConformidade != null ? `${ultimaAuditoria.taxaConformidade.toFixed(1)}%` : '—'}
            />
            <Row icon={AlertTriangle} label="Não conformidades anteriores" value={String(ultimaAuditoria.naoConformes)} />
          </>
        ) : (
          <Row icon={Calendar} label="Última auditoria" value="Nenhum registro anterior" />
        )}

        {ativosCount === 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/[0.06] p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
            <p className="text-xs text-muted-foreground">Nenhum funcionário ativo encontrado para auditar.</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
