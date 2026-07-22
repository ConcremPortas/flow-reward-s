import type { Cargo } from '@/hooks/useCargos';

/** As duas visões da Central de Estrutura de Cargos. */
export type JobsView = 'lista' | 'estrutura';

/**
 * Situação cadastral DERIVADA de um cargo (nunca persistida). Um cargo pode ter
 * mais de uma lacuna; `situacao` é a mais relevante e `lacunas` lista todas.
 */
export type JobSituacao =
  | 'regular'
  | 'sem_nivel'
  | 'sem_faixa'
  | 'sem_setor'
  | 'sem_ocupantes'
  | 'revisar_enquadramento'
  | 'configuracao_incompleta';

export interface JobFilters {
  busca: string;
  setorId: string | null;
  nivel: string | null;
  status: 'ativos' | 'inativos' | 'todos';
  ocupacao: 'todas' | 'ocupados' | 'sem_ocupantes';
  situacao: 'todas' | 'regular' | 'incompleta';
  faixa: 'todas' | 'com_faixa' | 'sem_faixa';
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  busca: '',
  setorId: null,
  nivel: null,
  status: 'ativos',
  ocupacao: 'todas',
  situacao: 'todas',
  faixa: 'todas',
};

/**
 * Cargo enriquecido com dados derivados em lote (ocupação, situação). É o que a
 * tabela e o drawer consomem — evita recomputar por linha e evita N+1.
 */
export interface JobRow {
  cargo: Cargo;
  ocupantes: number;
  situacao: JobSituacao;
  lacunas: JobSituacao[];
  temFaixa: boolean;
  semSetor: boolean;
  semNivel: boolean;
  /** Ocupantes com salário conhecido fora da faixa do cargo (só se autorizado). */
  ocupantesForaDaFaixa: number | null;
}
