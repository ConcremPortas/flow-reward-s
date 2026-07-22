import { AlertTriangle, Users, Calendar, History, Gauge } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { formatDateBR } from '@/lib/dateTime';
import type { LocationSummary } from '@/features/dss/types';

interface Props {
  localSelecionado: boolean;
  localNome?: string;
  summary: LocationSummary | null;
}

/** Resumo do local — só mostra dados realmente disponíveis (nada inventado). */
export function DssLocationSummary({ localSelecionado, localNome, summary }: Props) {
  if (!localSelecionado) {
    return (
      <SectionCard title="Resumo do Local" className="h-full">
        <p className="text-sm text-muted-foreground">Selecione um local para ver o resumo de vínculos e histórico.</p>
      </SectionCard>
    );
  }

  if (!summary) {
    return (
      <SectionCard title="Resumo do Local" className="h-full">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Resumo do Local" description={localNome} className="h-full">
      <div className="space-y-3">
        <Row icon={Users} label="Funcionários vinculados" value={String(summary.vinculados)} />
        {summary.ultimoDss ? (
          <Row icon={Calendar} label="Último DSS" value={`${formatDateBR(summary.ultimoDss.data)} · ${summary.ultimoDss.tema}`} />
        ) : (
          <Row icon={Calendar} label="Último DSS" value="Nenhum registro anterior" />
        )}
        <Row icon={History} label="DSS nos últimos 90 dias" value={String(summary.dssRecentes)} />
        <Row icon={Gauge} label="Participação média histórica" value={summary.participacaoMedia != null ? `${summary.participacaoMedia.toFixed(1)}%` : '—'} />

        {summary.vinculados === 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/[0.06] p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
            <p className="text-xs text-muted-foreground">Nenhum funcionário ativo vinculado a este local. Cadastre o vínculo antes de registrar o DSS.</p>
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
