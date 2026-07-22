import type { JobsSalariesView } from './types/jobsSalaries.types';

export const JOBS_SALARIES_VIEWS: JobsSalariesView[] = ['resumo', 'estrutura', 'remuneracao', 'governanca'];

const VALID = new Set<string>(JOBS_SALARIES_VIEWS);

/** Normaliza o parâmetro `?view=`; qualquer valor inválido cai em 'resumo'. */
export function normalizeJobsSalariesView(raw: string | null | undefined): JobsSalariesView {
  return raw && VALID.has(raw) ? (raw as JobsSalariesView) : 'resumo';
}

export const VIEW_LABEL: Record<JobsSalariesView, string> = {
  resumo: 'Visão executiva',
  estrutura: 'Estrutura',
  remuneracao: 'Remuneração',
  governanca: 'Governança',
};
