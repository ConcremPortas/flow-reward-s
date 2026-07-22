// Tipos da Central de Apuração de Ocorrências. Só contratos — sem lógica.

export type OccurrenceTab = 'todos' | 'com_ocorrencia' | 'alterados' | 'sem_setor';
export type OccurrenceRowKind = 'sem_alteracao' | 'alterado' | 'com_ocorrencia' | 'erro' | 'nao_salvo';

/** Valores de faltas/advertências de um funcionário na competência (mesmo shape do payload atual). */
export interface OccurrenceEntry {
  faltas: number;
  advertencias: number;
}

export type OccurrenceDraftMap = Record<string, OccurrenceEntry>;

export interface OccurrenceFilters {
  search: string;
  setorId: string;
  categoriaId: string;
  status: string; // status real do funcionário (Ativo/Férias/Licença/...) — 'todos' = sem filtro
  tipo: 'todos' | 'falta' | 'advertencia';
  somenteComOcorrencia: boolean;
  somenteAlterados: boolean;
  ocultarZerados: boolean;
}

export const DEFAULT_OCCURRENCE_FILTERS: OccurrenceFilters = {
  search: '',
  setorId: 'todos',
  categoriaId: 'todos',
  status: 'todos',
  tipo: 'todos',
  somenteComOcorrencia: false,
  somenteAlterados: false,
  ocultarZerados: false,
};

/** Linha de pré-visualização da importação. */
export interface OccurrenceImportRow {
  line: number;
  cod_funcionario: string;
  nome: string;
  faltas: number;
  advertencias: number;
  status: 'valido' | 'alerta' | 'invalido' | 'duplicado';
  mensagem?: string;
  funcionarioId?: string;
}

export interface OccurrenceImportSummary {
  total: number;
  validos: number;
  alertas: number;
  invalidos: number;
  duplicados: number;
}

/** Item do histórico consolidado por funcionário/competência. */
export interface OccurrenceHistoryRow {
  funcionarioId: string;
  nome: string;
  cod: string;
  setor: string | null;
  competencia: string;
  faltas: number;
  advertencias: number;
  total: number;
  variacao: number | null; // vs. competência anterior do mesmo funcionário
}

export interface OccurrenceMonthPoint {
  competencia: string;
  label: string;
  totalFaltas: number;
  totalAdvertencias: number;
  pessoasComOcorrencia: number;
}
