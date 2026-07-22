// Tipos da Central Operacional de Apuração da Produção por Setor. Só contratos.
//
// Nota de auditoria: a competência é persistida na coluna `data_producao`
// (tipo `date`) sempre como o primeiro dia do mês — 'YYYY-MM-01'. Nesta feature
// a competência circula como 'YYYY-MM' e só é convertida para 'YYYY-MM-01' na
// fronteira de persistência (nunca sofre conversão de timezone).

export type ProductionSituacao = 'superada' | 'proxima' | 'abaixo' | 'pendente';

/** Valores editáveis de um setor na competência. */
export interface ProductionEntry {
  meta: number | null;
  realizado: number | null;
}

/** Mapa {setorId: ProductionEntry} usado como baseline/draft da apuração. */
export type ProductionDraftMap = Record<string, ProductionEntry>;

/** Linha da grade de apuração — setor + valores + situação derivada. */
export interface ProductionRow {
  setorId: string;
  setorNome: string;
  empresaId: string | null;
  empresaNome: string | null;
  unidade: string;
  meta: number | null;
  realizado: number | null;
  percentual: number | null; // realizado/meta*100 — null quando não calculável
  desvio: number | null;      // realizado - meta — null quando ausente
  situacao: ProductionSituacao;
  registroId: string | null;  // id em concremrh_producao_setor; null = pendente (sem registro)
  temRegistro: boolean;
  observacoes: string | null;
  // Comparação com a competência anterior (preenchido só quando ativa)
  metaAnterior?: number | null;
  realizadoAnterior?: number | null;
  percentualAnterior?: number | null;
  variacaoRealizado?: number | null; // % de variação realizado vs. anterior
}

export interface ProductionFilters {
  search: string;
  empresaId: string;
  setorId: string;
  situacao: 'todos' | ProductionSituacao;
  unidade: string;
  somentePendentes: boolean;
  somenteAlterados: boolean;
}

export const DEFAULT_PRODUCTION_FILTERS: ProductionFilters = {
  search: '',
  empresaId: 'todos',
  setorId: 'todos',
  situacao: 'todos',
  unidade: 'todos',
  somentePendentes: false,
  somenteAlterados: false,
};

export interface ProductionHistoryFilters {
  search: string;
  competenciaInicial: string;
  competenciaFinal: string;
  empresaId: string;
  setorId: string;
  situacao: 'todos' | ProductionSituacao;
  unidade: string;
}

export const DEFAULT_HISTORY_FILTERS: ProductionHistoryFilters = {
  search: '',
  competenciaInicial: '',
  competenciaFinal: '',
  empresaId: 'todos',
  setorId: 'todos',
  situacao: 'todos',
  unidade: 'todos',
};

/** Linha do histórico (um registro salvo, com competência). */
export interface ProductionHistoryRow extends ProductionRow {
  competencia: string; // 'YYYY-MM'
}

export const UNIDADES_MEDIDA = [
  { value: 'unidades', label: 'Unidades' },
  { value: 'pecas', label: 'Peças' },
  { value: 'kg', label: 'Quilogramas' },
  { value: 'toneladas', label: 'Toneladas' },
  { value: 'metros', label: 'Metros' },
  { value: 'litros', label: 'Litros' },
] as const;

// ── Importação ────────────────────────────────────────────────────────────────

export type ImportRowStatus = 'valido' | 'alerta' | 'invalido';

export interface ImportParsedRow {
  linha: number;
  setorId: string | null;
  setorNome: string;
  competencia: string;    // 'YYYY-MM' resolvida, ou '' se inválida
  meta: number | null;
  realizado: number | null;
  unidade: string;
  status: ImportRowStatus;
  problema: string | null;
  jaExiste: boolean;      // setor+competência já tem registro salvo
}

export interface ImportSummary {
  total: number;
  validos: number;
  alertas: number;
  invalidos: number;
}
