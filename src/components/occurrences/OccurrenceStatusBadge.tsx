import { StatusBadge } from '@/components/app/StatusBadge';
import type { OccurrenceRowKind } from '@/features/occurrences/types';

const CONFIG: Record<OccurrenceRowKind, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' } | null> = {
  sem_alteracao: null, // não exibe badge — reduz ruído visual em centenas de linhas zeradas
  alterado: { label: 'Alterado', variant: 'warning' },
  com_ocorrencia: { label: 'Com ocorrência', variant: 'info' },
  erro: { label: 'Erro', variant: 'danger' },
  nao_salvo: { label: 'Não salvo', variant: 'warning' },
};

export function OccurrenceStatusBadge({ status }: { status: OccurrenceRowKind }) {
  const cfg = CONFIG[status];
  if (!cfg) return null;
  return <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>;
}
