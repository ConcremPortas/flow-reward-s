import type { JobEmployeesView } from './types/job-employee.types';

export const JOB_EMPLOYEES_VIEWS: JobEmployeesView[] = ['colaboradores', 'pendencias'];
const VALID = new Set<string>(JOB_EMPLOYEES_VIEWS);

/** Normaliza `?view=`; inválido cai em 'colaboradores'. */
export function normalizeJobEmployeesView(raw: string | null | undefined): JobEmployeesView {
  return raw && VALID.has(raw) ? (raw as JobEmployeesView) : 'colaboradores';
}

export const JOB_EMPLOYEES_VIEW_LABEL: Record<JobEmployeesView, string> = {
  colaboradores: 'Colaboradores',
  pendencias: 'Pendências de enquadramento',
};

export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
