import { AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiAuditFormData } from '@/features/epi/types/epi.types';
import type { Funcionario } from '@/hooks/useFuncionarios';

interface Props {
  data: EpiAuditFormData;
  auditados: Funcionario[];
  conformes: Funcionario[];
  naoConformes: Funcionario[];
}

export function EpiAuditReview({ data, auditados, conformes, naoConformes }: Props) {
  const total = auditados.length;
  const taxa = total > 0 ? (conformes.length / total) * 100 : 0;
  const setoresAfetados = [...new Set(naoConformes.map((f) => f.setor?.nome || 'Sem setor'))];

  return (
    <div className="space-y-4">
      <SectionCard title="Resumo da Auditoria">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Data" value={formatDateBR(data.dataAuditoria)} />
          <Field label="Total auditado" value={String(total)} />
          <Field label="Conformes" value={String(conformes.length)} />
          <Field label="Não conformes" value={String(naoConformes.length)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Taxa de conformidade" value={`${taxa.toFixed(0)}%`} />
          <Field label="Setores afetados" value={setoresAfetados.length > 0 ? String(setoresAfetados.length) : '—'} />
        </div>
      </SectionCard>

      {naoConformes.length > 0 && (
        <SectionCard title="Funcionários Não Conformes" description={`Setores afetados: ${setoresAfetados.join(', ')}`}>
          <div className="flex flex-wrap gap-1.5">
            {naoConformes.map((f) => (
              <span key={f.id} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">{f.nome}</span>
            ))}
          </div>
        </SectionCard>
      )}

      {taxa < 70 && total > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/[0.06] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
          <p className="text-xs text-muted-foreground">Taxa de conformidade abaixo de 70%. Confira se todas as situações foram marcadas corretamente antes de salvar.</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
