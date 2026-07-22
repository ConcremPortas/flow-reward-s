import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import type { GovernanceIssue, Severidade } from '../domain/governanceIssues';

const SEV_VARIANT: Record<Severidade, StatusVariant> = { alta: 'danger', media: 'warning', baixa: 'info' };
const SEV_LABEL: Record<Severidade, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

interface Props {
  issues: GovernanceIssue[];
  /** Quando compacto, mostra só os destaques (visão executiva). */
  compacto?: boolean;
}

/** Centro de atenção: pendências de governança priorizadas por severidade. */
export function AttentionCenter({ issues, compacto }: Props) {
  const lista = compacto ? issues.slice(0, 3) : issues;

  if (issues.length === 0) {
    return (
      <SectionCard title="Centro de atenção" description="Pendências que exigem ação.">
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm text-foreground">Nenhuma pendência identificada no recorte atual.</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Centro de atenção"
      description="Pendências priorizadas por severidade."
      actions={compacto && issues.length > 3 ? <span className="text-xs text-muted-foreground">{formatNumberBR(issues.length)} no total</span> : undefined}
    >
      <div className="space-y-2.5">
        {lista.map((issue) => (
          <div key={issue.chave} className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-card p-3.5">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${issue.severidade === 'alta' ? 'text-destructive' : issue.severidade === 'media' ? 'text-status-warning' : 'text-primary'}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{issue.titulo}</h4>
                  <StatusBadge variant={SEV_VARIANT[issue.severidade]}>{SEV_LABEL[issue.severidade]}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{issue.descricao}</p>
                {!compacto && <p className="mt-1.5 text-xs text-muted-foreground/90"><span className="font-medium text-foreground/80">Ação sugerida:</span> {issue.acaoSugerida}</p>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-lg font-bold tabular-nums text-foreground">{formatNumberBR(issue.quantidade)}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
