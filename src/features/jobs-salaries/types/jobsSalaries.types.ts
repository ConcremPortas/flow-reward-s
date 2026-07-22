import type { Cargo } from '@/hooks/useCargos';
import type { Setor } from '@/hooks/useSetores';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';

/** As quatro visões da Central de Cargos e Remuneração. */
export type JobsSalariesView = 'resumo' | 'estrutura' | 'remuneracao' | 'governanca';

/** Estado de carregamento/erro por fonte de dados. */
export interface LoadState {
  loading: boolean;
  error: boolean;
}

/** Filtros globais (persistidos na URL). Competência só se houver histórico mensal. */
export interface JobsSalariesFilters {
  setorId: string | null;
  nivel: string | null;
  cargoId: string | null;
  status: 'ativos' | 'inativos' | 'todos';
  busca: string;
}

export const DEFAULT_FILTERS: JobsSalariesFilters = {
  setorId: null,
  nivel: null,
  cargoId: null,
  status: 'ativos',
  busca: '',
};

/**
 * Enquadramento atual de um colaborador em um CARGO — derivado do último
 * registro de `historico_cargos` (não há `cargo_id` em funcionários). Ausência
 * de registro = colaborador NÃO enquadrado (vínculo é com FUNÇÃO, não cargo).
 */
export interface Enquadramento {
  funcionarioId: string;
  cargoId: string | null;
  cargoNome: string | null;
  salarioRegistrado: number | null;
  dataMudanca: string;
}

/** Pacote bruto de dados consolidados para o dashboard. */
export interface JobsSalariesData {
  cargos: Cargo[];
  setores: Setor[];
  funcionarios: FuncionarioSensivel[];
  estrutura: EstruturaHierarquica[];
  historico: HistoricoCargo[];
  /** Autorização para ver remuneração individual/agregada (admin OU cargos_salarios). */
  autorizadoRemuneracao: boolean;
  load: {
    cargos: LoadState;
    setores: LoadState;
    funcionarios: LoadState;
    estrutura: LoadState;
    historico: LoadState;
  };
}
