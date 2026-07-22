import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { CadastroKey, ModeloRow, FornecedorRow, OpcaoRow } from '../../services/cadastrosApi';
import type { CategoriaRow, TamanhoRow, UnidadeRow, VarianteRow } from '../../types/db.types';

export type MasterKey = CadastroKey;
export type StatusFiltro = 'todos' | 'ativos' | 'inativos';
export type Ordenacao = 'nome' | 'recentes' | 'pendencias';

export type Row = Record<string, unknown>;

/** Normalização para busca (minúsculas pt-BR, sem acentos). */
export const norm = (s: string) => (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export const ativoDe = (r: Row): boolean => r.ativo !== false;

/** Título humano de um registro (para drawer/diálogos), por tipo de cadastro. */
export function tituloRegistro(key: MasterKey, r: Row): string {
  const g = (k: string) => String(r[k] ?? '').trim();
  if (key === 'tamanhos') return g('rotulo') || 'Tamanho';
  if (key === 'fornecedores') return g('nome_fantasia') || g('razao_social') || 'Fornecedor';
  return g('nome') || g('codigo') || 'Registro';
}

/** Próximo código sequencial no formato PREFIXO-0001 (a partir do maior existente). */
export function proximoCodigo(codigos: (string | null | undefined)[], prefixo: string): string {
  const re = new RegExp(`^${prefixo}-(\\d+)$`, 'i');
  let max = 0;
  for (const c of codigos) { const m = re.exec((c ?? '').trim()); if (m) max = Math.max(max, Number(m[1])); }
  return `${prefixo}-${String(max + 1).padStart(4, '0')}`;
}

export const GENERO_OPTS = [{ id: 'UNISSEX', nome: 'Unissex' }, { id: 'MASCULINO', nome: 'Masculino' }, { id: 'FEMININO', nome: 'Feminino' }];
export const TIPO_TAM_OPTS = [{ id: 'ROUPA', nome: 'Roupa' }, { id: 'CALCADO', nome: 'Calçado' }];
export const tipoTamLabel = (t?: string | null) => (t === 'CALCADO' ? 'Calçado' : 'Roupa');
export const generoLabel = (g?: string | null) => GENERO_OPTS.find((o) => o.id === g)?.nome ?? 'Unissex';

// ── Formulário (config-driven) ──────────────────────────────────────────
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox';
export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ id: string; nome: string }>;
  optional?: boolean; // select pode ficar vazio (grava null)
  readOnly?: boolean; // exibido, preenchido, não editável (ex.: código automático)
  hint?: string;
  section?: string; // agrupamento em formulário amplo
  full?: boolean; // ocupa a linha inteira no grid de 2 colunas
}

// ── Indicadores / tabela / drawer ─────────────────────────────────────────
export type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface Indicator { key: string; label: string; value: number; icon: LucideIcon; tone: Tone; hint: string }

export interface Column { header: string; cell: (r: Row) => ReactNode; align?: 'right'; className?: string }

export interface PendenciaInfo { label: string; tone: 'warning' | 'danger'; hint: string }

export interface DetailField { label: string; value: ReactNode; full?: boolean }
export interface DetailSection { title: string; fields?: DetailField[]; node?: ReactNode }
export interface DependencyLink { label: string; count: number; to?: string }

export interface TabConfig {
  key: MasterKey;
  singular: string;
  novoLabel: string;
  icon: LucideIcon;
  prefix?: string; // código automático (UN / VAR)
  formLayout: 'compact' | 'wide';
  rows: Row[]; // todas as linhas (ativas + inativas)
  columns: Column[];
  fields: FieldDef[];
  indicators: Indicator[];
  searchText: (r: Row) => string;
  pendencias: (r: Row) => PendenciaInfo[];
  detail: (r: Row) => { sections: DetailSection[]; dependencies: DependencyLink[] };
  emptyTitle: string;
  emptyDescription: string;
  /** Pré-condição ausente (ex.: modelo exige categoria ativa) — bloqueia o botão criar. */
  criarBloqueado?: string;
}

// ── Contexto derivado (maps + resolvers) compartilhado com os configs ──
export interface UnidadeAgg { pecas: number; itens: number; valor: number; alertas: number }
export interface SaldoDetalhe { unidadeId: string; unidadeNome: string; quantidade: number; minimo: number; alerta: boolean }
export interface VarNaUnidade { varianteId: string; nome: string; codigo: string; quantidade: number; alerta: boolean }

export interface MasterCtx {
  categoriaNome: (id?: string | null) => string;
  modeloNome: (id?: string | null) => string;
  tamanhoLabel: (id?: string | null) => string;
  empresaNome: (id?: string | null) => string;
  setorNome: (id?: string | null) => string;
  fornecedorNome: (id?: string | null) => string;
  unidadeNome: (id?: string | null) => string;
  usuarioNome: (id?: string | null) => string;

  saldoVariante: (varId: string) => number;
  saldoDetalheVariante: (varId: string) => SaldoDetalhe[];
  alertaVariante: (varId: string) => boolean;
  custoVariante: (varId: string) => number;

  modelosDaCategoria: (catId: string) => ModeloRow[];
  variantesAtivasDaCategoria: (catId: string) => number;
  variantesDoModelo: (modeloId: string) => VarianteRow[];
  tamanhosDoModelo: (modeloId: string) => string[];
  variantesDoTamanho: (tamId: string) => number;
  variantesDoFornecedor: (fornId: string) => { total: number; ativas: number };

  unidadeAgg: (unidadeId: string) => UnidadeAgg;
  variantesDaUnidade: (unidadeId: string) => VarNaUnidade[];

  // Listas completas (indicadores)
  categorias: CategoriaRow[];
  modelos: ModeloRow[];
  tamanhos: TamanhoRow[];
  variantes: VarianteRow[];
  unidades: UnidadeRow[];
  fornecedores: FornecedorRow[];
  empresas: OpcaoRow[];
  setores: OpcaoRow[];
}

/** Opções ATIVAS para selects dos formulários (não permite pai inativo). */
export interface FormOpcoes {
  categorias: OpcaoRow[];
  modelos: OpcaoRow[];
  tamanhos: OpcaoRow[];
  fornecedores: OpcaoRow[];
  empresas: OpcaoRow[];
  setores: OpcaoRow[];
}
