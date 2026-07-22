import { supabase } from '@/integrations/supabase/client';
import type { CategoriaRow, TamanhoRow, UnidadeRow, VarianteRow } from '../types/db.types';

/**
 * CRUD dos CADASTROS do estoque. São tabelas de ESCRITA DIRETA (a RLS do 0003
 * permite INSERT/UPDATE a quem tem acesso ao módulo) — não usam RPC. As RPCs
 * transacionais são só para operações de saldo (entrada/entrega/etc.).
 * Uso de `(supabase as any)` pois as tabelas não constam no types.ts gerado.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Tabelas de cadastro permitidas (whitelist — evita escrita em tabela arbitrária). */
export const CADASTRO_TABLES = {
  categorias: 'concremrh_estoque_categorias',
  modelos: 'concremrh_estoque_modelos',
  tamanhos: 'concremrh_estoque_tamanhos',
  variantes: 'concremrh_estoque_variantes',
  unidades: 'concremrh_estoque_unidades',
  fornecedores: 'concremrh_estoque_fornecedores',
} as const;
export type CadastroKey = keyof typeof CADASTRO_TABLES;

function unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ── Getters (os simples reaproveitam inventoryApi; aqui os que faltavam) ──
export interface ModeloRow { id: string; nome: string; descricao: string | null; categoria_id: string; ativo: boolean; created_at?: string | null; updated_at?: string | null }
export interface FornecedorRow {
  id: string; razao_social: string; nome_fantasia: string | null; cnpj: string | null;
  email: string | null; telefone: string | null; endereco: string | null; contato: string | null;
  categorias: string | null; prazo_entrega_dias: number | null; observacoes: string | null; ativo: boolean;
  created_at?: string | null; updated_at?: string | null;
}
export interface OpcaoRow { id: string; nome: string }

const SEL_MODELO = 'id, nome, descricao, categoria_id, ativo, created_at, updated_at';
const SEL_FORNECEDOR = 'id, razao_social, nome_fantasia, cnpj, email, telefone, endereco, contato, categorias, prazo_entrega_dias, observacoes, ativo, created_at, updated_at';

export async function getModelos(): Promise<ModeloRow[]> {
  return unwrap<ModeloRow[]>(await db.from('concremrh_estoque_modelos').select(SEL_MODELO).order('nome')) ?? [];
}
export async function getFornecedores(): Promise<FornecedorRow[]> {
  return unwrap<FornecedorRow[]>(await db.from('concremrh_estoque_fornecedores').select(SEL_FORNECEDOR).order('razao_social')) ?? [];
}

// ── Getters "todas" (ativas + inativas) para a central de cadastros ──
// (getModelos/getFornecedores já trazem tudo; getVariantesTodas vem do inventoryApi.)
export async function getCategoriasTodas(): Promise<CategoriaRow[]> {
  return unwrap<CategoriaRow[]>(await db.from('concremrh_estoque_categorias').select('*').order('nome')) ?? [];
}
export async function getTamanhosTodas(): Promise<TamanhoRow[]> {
  return unwrap<TamanhoRow[]>(await db.from('concremrh_estoque_tamanhos').select('*').order('tipo').order('ordem')) ?? [];
}
export async function getUnidadesTodas(): Promise<UnidadeRow[]> {
  return unwrap<UnidadeRow[]>(await db.from('concremrh_estoque_unidades').select('*').order('codigo')) ?? [];
}

/** Empresas/Setores corporativos (para os selects de Unidade). Reuso — sem duplicação. */
export async function getEmpresas(): Promise<OpcaoRow[]> {
  return unwrap<OpcaoRow[]>(await db.from('concremrh_empresas').select('id, nome').eq('ativo', true).order('nome')) ?? [];
}
export async function getSetores(): Promise<OpcaoRow[]> {
  return unwrap<OpcaoRow[]>(await db.from('concremrh_setores').select('id, nome').eq('ativo', true).order('nome')) ?? [];
}

/**
 * Nomes de usuários para resolver created_by/updated_by na auditoria dos drawers.
 * Tolerante: se a RLS bloquear a leitura, retorna [] (auditoria mostra só datas).
 */
export async function getUsuariosNomes(): Promise<OpcaoRow[]> {
  try {
    const res = await db.from('concremrh_usuarios').select('id, nome');
    if (res.error) return [];
    return (res.data as OpcaoRow[]) ?? [];
  } catch { return []; }
}

// ── Mutações genéricas (por tabela da whitelist) ──
export async function criarCadastro<T>(key: CadastroKey, valores: Record<string, unknown>): Promise<T> {
  const row = unwrap<T[]>(await db.from(CADASTRO_TABLES[key]).insert([valores]).select());
  return row[0];
}
export async function atualizarCadastro(key: CadastroKey, id: string, valores: Record<string, unknown>): Promise<void> {
  const { error } = await db.from(CADASTRO_TABLES[key]).update(valores).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function definirAtivoCadastro(key: CadastroKey, id: string, ativo: boolean): Promise<void> {
  const { error } = await db.from(CADASTRO_TABLES[key]).update({ ativo }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Exclusão física (só admin — garantido por RLS 0006). Recusa se houver vínculos (FK restrict). */
export async function excluirCadastro(key: CadastroKey, id: string): Promise<void> {
  const { error } = await db.from(CADASTRO_TABLES[key]).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export type { CategoriaRow, TamanhoRow, UnidadeRow, VarianteRow };
