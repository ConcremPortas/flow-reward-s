import { StatusBadge } from '@/components/app/StatusBadge';
import { SITUACAO_LABEL, SITUACAO_TOM } from '../domain/jobStatus';
import type { JobSituacao } from '../types/job.types';

const TOM_TO_VARIANT = { success: 'success', warning: 'warning', danger: 'danger', info: 'info', neutral: 'neutral' } as const;

/** Badge da situação cadastral derivada (sem persistência). */
export function JobSituacaoBadge({ situacao }: { situacao: JobSituacao }) {
  return <StatusBadge variant={TOM_TO_VARIANT[SITUACAO_TOM[situacao]]}>{SITUACAO_LABEL[situacao]}</StatusBadge>;
}
