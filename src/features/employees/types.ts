// Tipos da Central de Gestão de Pessoas. Só contratos — sem lógica.
import type { Funcionario } from '@/hooks/useFuncionarios';

export type EmployeeTab = 'todos' | 'ativos' | 'inativos' | 'pendencias' | 'elegibilidade';

export type EligibilityStatus = 'elegivel' | 'pendente' | 'nao_elegivel' | 'fora_premiacao';

export interface CompletionCheck {
  complete: boolean;
  missing: string[];   // rótulos legíveis dos campos ausentes
}

/** Dados do formulário do wizard — mesmos campos do formulário atual (nada novo). */
export interface EmployeeFormData {
  cod_funcionario: string;
  nome: string;
  empresa_id: string;
  setor_id: string;
  funcao_id: string;
  categoria_id: string;
  base_premiacao_id: string;
  faixa_id: string;
  local_dss_id: string;
  data_admissao: string;
  status: string;
  valor_fixo: string;
  setor_ids: string[];
}

export const EMPTY_FORM_DATA: EmployeeFormData = {
  cod_funcionario: '',
  nome: '',
  empresa_id: '',
  setor_id: '',
  funcao_id: '',
  categoria_id: '',
  base_premiacao_id: '',
  faixa_id: '',
  local_dss_id: '',
  data_admissao: '',
  status: 'Ativo',
  valor_fixo: '',
  setor_ids: [],
};

export interface EmployeeFilters {
  search: string;
  empresaId: string;
  setorId: string;
  funcaoId: string;
  categoriaId: string;
  localDssId: string;
  status: string;
  eligibility: EligibilityStatus | 'todos';
}

export const DEFAULT_FILTERS: EmployeeFilters = {
  search: '',
  empresaId: 'todos',
  setorId: 'todos',
  funcaoId: 'todos',
  categoriaId: 'todos',
  localDssId: 'todos',
  status: 'todos',
  eligibility: 'todos',
};

/** Payload de inserção — mesmos campos enviados pelo fluxo de importação anterior. */
export interface ImportInsertPayload {
  nome: string;
  cpf: string;
  data_admissao: string | null;
  empresa_id: string;
  setor_id: string | null;
  funcao_id: string | null;
  categoria_id: string | null;
  base_premiacao_id: string | null;
  faixa_id: string | null;
  local_dss_id: string | null;
  status: string;
  ativo: boolean;
}

/** Linha resolvida da tabela de pré-visualização de importação. */
export interface ImportPreviewRow {
  line: number;
  nome: string;
  cod_funcionario: string;
  status: 'valido' | 'alerta' | 'invalido' | 'duplicado';
  problema?: string;
  payload?: ImportInsertPayload;
}

export interface ImportSummary {
  total: number;
  validos: number;
  alertas: number;
  invalidos: number;
  duplicados: number;
}

export type { Funcionario };
