import { AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { formatDateBR } from '@/lib/dateTime';
import type { LocalDSS } from '@/hooks/useLocaisDSS';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DssFormData } from '@/features/dss/types';

interface Props {
  data: DssFormData;
  locais: LocalDSS[];
  presentes: Funcionario[];
  ausentes: Funcionario[];
}

export function DssReviewStep({ data, locais, presentes, ausentes }: Props) {
  const localNome = locais.find((l) => l.id === data.localDssId)?.nome || '—';
  const total = presentes.length + ausentes.length;
  const participacao = total > 0 ? (presentes.length / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <SectionCard title="Resumo do Registro">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Local" value={localNome} />
          <Field label="Data" value={formatDateBR(data.dataRealizacao)} />
          <Field label="Tema" value={data.tema || '—'} />
          <Field label="Participação" value={`${participacao.toFixed(0)}%`} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Field label="Vinculados" value={String(total)} />
          <Field label="Presentes" value={String(presentes.length)} />
          <Field label="Ausentes" value={String(ausentes.length)} />
        </div>
      </SectionCard>

      {ausentes.length > 0 && (
        <SectionCard title="Funcionários Ausentes" description="Serão registrados como ausentes neste DSS">
          <div className="flex flex-wrap gap-1.5">
            {ausentes.map((f) => (
              <span key={f.id} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">{f.nome}</span>
            ))}
          </div>
        </SectionCard>
      )}

      {participacao < 70 && total > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/[0.06] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
          <p className="text-xs text-muted-foreground">Participação abaixo de 70%. Confira se todas as presenças foram marcadas corretamente antes de salvar.</p>
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
