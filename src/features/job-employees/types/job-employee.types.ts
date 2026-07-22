import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Cargo } from '@/hooks/useCargos';

/** As duas visões da Central de Enquadramento de Colaboradores. */
export type JobEmployeesView = 'colaboradores' | 'pendencias';

/**
 * Situação de ENQUADRAMENTO derivada (nunca persistida). Distingue função
 * (cadastro RH) de cargo (estrutura). Estados de salário só quando autorizado.
 */
export type EmployeeJobSituacao =
  | 'regular'
  | 'sem_cargo'
  | 'somente_funcao'
  | 'sem_nivel'
  | 'sem_faixa'
  | 'salario_nao_informado'
  | 'abaixo_faixa'
  | 'acima_faixa'
  | 'revisar';

/** Posição do salário do colaborador frente à faixa do cargo. */
export type SalaryPosition = 'abaixo' | 'dentro' | 'acima' | 'sem_faixa' | 'sem_salario' | 'restrito';

export interface JobEmployeeFilters {
  busca: string;
  empresaId: string | null;
  setorId: string | null;
  funcaoId: string | null;
  cargoId: string | null;
  status: 'ativos' | 'inativos' | 'todos';
  enquadramento: 'todos' | 'enquadrados' | 'sem_cargo' | 'pendentes';
  faixa: 'todas' | 'dentro' | 'abaixo' | 'acima' | 'sem_salario';
}

export const DEFAULT_JOB_EMPLOYEE_FILTERS: JobEmployeeFilters = {
  busca: '',
  empresaId: null,
  setorId: null,
  funcaoId: null,
  cargoId: null,
  status: 'ativos',
  enquadramento: 'todos',
  faixa: 'todas',
};

export type SortKey = 'nome' | 'funcao' | 'cargo' | 'setor' | 'enquadramento';
export interface SortState { key: SortKey; dir: 'asc' | 'desc' }

/** Linha enriquecida do colaborador (derivada em lote — sem N+1). */
export interface JobEmployeeRow {
  funcionario: Funcionario;
  funcaoNome: string | null;
  setorNome: string | null;
  empresaNome: string | null;
  /** Cargo estruturado atual, via enquadramento (histórico). Null = não vinculado. */
  cargo: Cargo | null;
  situacao: EmployeeJobSituacao;
  pendencias: EmployeeJobSituacao[];
  /** Salário conhecido do colaborador (view guardada). null = ausente ou não autorizado. */
  salario: number | null;
  posicaoSalarial: SalaryPosition;
  ativo: boolean;
}
