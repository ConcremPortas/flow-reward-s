import type { JobsView } from './types/job.types';

export const JOBS_VIEWS: JobsView[] = ['lista', 'estrutura'];

const VALID = new Set<string>(JOBS_VIEWS);

/** Normaliza `?view=`; qualquer valor inválido cai em 'lista'. */
export function normalizeJobsView(raw: string | null | undefined): JobsView {
  return raw && VALID.has(raw) ? (raw as JobsView) : 'lista';
}

export const JOBS_VIEW_LABEL: Record<JobsView, string> = {
  lista: 'Lista de cargos',
  estrutura: 'Mapa da estrutura',
};
