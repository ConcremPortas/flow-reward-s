// Tipos da Gestão de Indicadores Setoriais. Só contratos.
//
// Auditoria: entidade `TipoIndicador` (tabela `concremrh_tipos_indicadores`).
// Campos persistidos: id, codigo, nome, descricao?, ativo, created_at, updated_at.
// O formulário legado edita codigo/nome/descricao. Exclusão é SOFT (ativo=false;
// fetch filtra ativo=true). `ativo` é a fonte de verdade do status e funciona como
// flag de soft-delete (não há ciclo ativo/inativo distinto da exclusão).
//
// CRÍTICO: esta tabela é um CATÁLOGO DESCRITIVO standalone — referenciada apenas
// pelo próprio hook. NÃO possui FK para as medições. As medições setoriais vivem
// em `concremrh_indicadores_setor` em COLUNAS FIXAS (por setor_id + competencia):
// hora_maquina_*, identificacao_nc_*, limpeza_*, tratamento_nc_*, operacao_segura_*.
// O motor/prévia leem essas COLUNAS diretamente — os códigos (HM/ID/L/NC/OPC) não
// dirigem nenhuma regra em código. Há apenas CORRESPONDÊNCIA SEMÂNTICA código↔coluna
// (observacional), usada aqui para derivar utilização. NÃO confundir com
// `concremrh_tipos_indicadores_gerais` (FAT/KITS) — entidade distinta.

export interface IndicatorTypeMeasurementUsage {
  temCorrespondencia: boolean;   // o código corresponde a uma coluna de medição
  coluna: string | null;         // prefixo da coluna correspondente (ex.: 'hora_maquina')
  medicoes: number;              // registros com valor nessa coluna
  setores: number;               // setores distintos com medição nessa coluna
  competencias: number;          // competências distintas com medição
  ultimaCompetencia: string | null; // 'YYYY-MM-01' mais recente
}

export type IndicatorTypeStatusKind = 'regular' | 'sem_utilizacao' | 'revisar' | 'config_incompleta';

export interface IndicatorTypeStatus {
  status: IndicatorTypeStatusKind;
  motivos: string[];
  descricao: string;
}

export interface IndicatorTypeRow {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  usage: IndicatorTypeMeasurementUsage;
  status: IndicatorTypeStatus;
  duplicadoCodigo: boolean;
  duplicadoNome: boolean;
}

export interface IndicatorTypeFilters {
  search: string;
  utilizacao: 'todos' | 'em_uso' | 'sem_medicao';
  situacao: 'todos' | IndicatorTypeStatusKind;
}

export const DEFAULT_INDICATOR_TYPE_FILTERS: IndicatorTypeFilters = {
  search: '', utilizacao: 'todos', situacao: 'todos',
};
