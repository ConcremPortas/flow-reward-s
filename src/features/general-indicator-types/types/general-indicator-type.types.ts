// Tipos da Gestão de Indicadores Gerais. Só contratos.
//
// Auditoria: entidade `TipoIndicadorGeral` (tabela `concremrh_tipos_indicadores_gerais`).
// Campos persistidos: id, nome, codigo, descricao?, ativo, created_at, updated_at.
// Distinta de `concremrh_tipos_indicadores` (SETORIAIS). Seed: FAT, KITS.
//
// Diferenças estruturais vs. setoriais (auditadas):
//   - `useTiposIndicadoresGerais` retorna TODOS os registros (ativos e inativos)
//     → `ativo` é um ciclo de vida REAL (Ativar/Inativar distinto da exclusão).
//   - Exclusão é HARD DELETE (`.delete()`) → sujeita a FK; bloqueamos quando há
//     medições e traduzimos erros de FK.
//   - Medições REAIS em `concremrh_indicadores_gerais` (FK tipo_indicador_id;
//     meta/realizado/percentual/competencia; UNIQUE (tipo_indicador_id, competencia)).
//
// Formatação por CÓDIGO (acoplamento documentado): não há campo persistido de
// unidade/tipo; a apresentação é resolvida por `resolveIndicatorDefinition(codigo)`
// (FAT → moeda BRL; KITS → número/kits). Os códigos FAT/KITS também dirigem regras
// TEXTUAIS de premiação (rewards-processing). NÃO renomear/alterar o código.

import type { IndicatorDefinition } from '@/features/general-indicators/domain/indicatorDefinitions';

export interface GeneralIndicatorTypeUsage {
  medicoes: number;                 // registros em concremrh_indicadores_gerais (FK)
  competencias: number;             // competências distintas
  ultimaCompetencia: string | null; // 'YYYY-MM-01' mais recente
  ultimoMeta: number | null;
  ultimoRealizado: number | null;
  ultimoPercentual: number | null;
}

export type GeneralIndicatorTypeStatusKind = 'regular' | 'sem_medicoes' | 'revisar' | 'config_incompleta';

export interface GeneralIndicatorTypeStatus {
  status: GeneralIndicatorTypeStatusKind;
  motivos: string[];
  descricao: string;
}

export interface GeneralIndicatorTypeRow {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  definition: IndicatorDefinition;  // resolvida pelo código (formatação/direção)
  usage: GeneralIndicatorTypeUsage;
  status: GeneralIndicatorTypeStatus;
  duplicadoCodigo: boolean;
  duplicadoNome: boolean;
}

export interface GeneralIndicatorTypeFilters {
  search: string;
  status: 'todos' | 'ativo' | 'inativo';
  utilizacao: 'todos' | 'com_medicao' | 'sem_medicao';
  situacao: 'todos' | GeneralIndicatorTypeStatusKind;
}

export const DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS: GeneralIndicatorTypeFilters = {
  search: '', status: 'todos', utilizacao: 'todos', situacao: 'todos',
};
