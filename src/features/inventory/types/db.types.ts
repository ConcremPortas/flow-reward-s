/**
 * Tipos das tabelas `concremrh_estoque_*` (não constam no types.ts gerado, pois
 * foram criadas depois — mesmo caso de useFuncionariosSensivel). Definidos aqui e
 * consumidos via `(supabase as any)`. Camada de dados; regras vivem em domain/.
 */

export interface UnidadeRow {
  id: string;
  codigo: string;
  nome: string;
  empresa_id: string;
  setor_id: string | null;
  descricao: string | null;
  ativo: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CategoriaRow { id: string; nome: string; ativo: boolean; created_at?: string | null; updated_at?: string | null }
export interface TamanhoRow { id: string; rotulo: string; tipo: string; ordem: number; ativo: boolean; created_at?: string | null; updated_at?: string | null }

export interface VarianteRow {
  id: string;
  codigo_interno: string;
  codigo_barras: string | null;
  nome: string;
  descricao: string | null;
  modelo_id: string;
  tamanho_id: string;
  fornecedor_id: string | null;
  genero: string;
  cor: string | null;
  material: string | null;
  marca: string | null;
  localizacao: string | null;
  custo_unitario: number;
  estoque_minimo_padrao: number;
  foto_url: string | null;
  ativo: boolean;
  deletado_em: string | null;
  deletado_por?: string | null;
  motivo_delecao?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  // Embeds (PostgREST)
  modelo?: { nome: string; categoria?: { nome: string } | null } | null;
  tamanho?: { rotulo: string; tipo: string } | null;
  fornecedor?: { razao_social: string; nome_fantasia: string | null } | null;
}

export interface SaldoRow {
  id: string;
  variante_id: string;
  unidade_id: string;
  quantidade: number;
  estoque_minimo: number | null;
  estoque_ideal: number | null;
}

export interface MovimentacaoRow {
  id: string;
  numero: string;
  tipo: string;
  unidade_id: string;
  referencia_tipo: string | null;
  observacao: string | null;
  created_at: string;
  // Embed reverso 1-1 (NF da entrada); PostgREST retorna array.
  documento?: Array<{ id: string; storage_key: string; nome_original: string }> | null;
}

/** Saldo de uma variante numa unidade (para composição na UI). */
export interface SaldoUnidade {
  unidadeId: string;
  unidadeNome: string;
  quantidade: number;
  minimoEfetivo: number;
  estoqueIdeal: number | null;
  status: import('./inventory.types').StockStatus;
}

/** Variante enriquecida com saldos por unidade (linha da tela Fardamentos). */
export interface FardamentoRow {
  variante: VarianteRow;
  categoriaNome: string | null;
  modeloNome: string | null;
  tamanhoRotulo: string | null;
  saldoTotal: number;
  saldos: SaldoUnidade[];
  emAlerta: boolean;
}

/** Item de uma entrada/entrega (payload das RPCs). */
export interface ItemInput {
  variante_id: string;
  quantidade: number;
}

export interface EntregaItemEmbed {
  variante_id: string;
  quantidade: number;
  variante?: { nome: string; codigo_interno: string } | null;
}

export interface EntregaRow {
  id: string;
  recibo: string;
  funcionario_id: string;
  unidade_id: string;
  tipo: string;
  status: string;
  created_at: string;
  funcionario?: { nome: string } | null;
  itens?: EntregaItemEmbed[];
}

export interface DevolucaoAtivaRow { variante_id: string; quantidade: number }

/** Devolução ativa (linha da tela de Estornos). Unidade obtida via entrega. */
export interface DevolucaoRow {
  id: string;
  entrega_id: string;
  variante_id: string;
  quantidade: number;
  condicao: string;
  destino: string;
  status: string;
  created_at: string;
  variante?: { nome: string; codigo_interno: string } | null;
  entrega?: { recibo: string; unidade_id: string } | null;
}
