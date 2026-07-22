import type { DeliveryType, MovementType, ReturnCondition, ReturnDestination } from '../types/inventory.types';

/** Erro de regra de domínio do estoque (mensagem pt-BR pronta para exibição). */
export class StockDomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'StockDomainError';
  }
}

export const MOVEMENT_TYPES: MovementType[] = [
  'ENTRADA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA', 'ENTREGA', 'DEVOLUCAO', 'ESTORNO_ENTREGA', 'ESTORNO_DEVOLUCAO',
];

export const DELIVERY_TYPES: DeliveryType[] = [
  'ADMISSAO', 'RENOVACAO', 'DESGASTE', 'TROCA_TAMANHO', 'PERDA', 'DANIFICACAO', 'MUDANCA_SETOR', 'EXTRAORDINARIA', 'COMPRA',
];

export const RETURN_CONDITIONS: ReturnCondition[] = ['NOVO', 'BOM', 'USADO', 'DANIFICADO', 'SEM_REUSO'];
export const RETURN_DESTINATIONS: ReturnDestination[] = ['ESTOQUE', 'HIGIENIZACAO', 'MANUTENCAO', 'BAIXA', 'DESCARTE'];

/**
 * Condições que permitem RE-ESTOCAGEM na devolução (comportamento caracterizado
 * e PRESERVADO do sistema original — não alterar sem aprovação).
 */
export const RESTOCK_CONDITIONS: ReturnCondition[] = ['NOVO', 'BOM', 'USADO'];

/** Status de colaborador que impedem entrega. */
export const STATUS_BLOQUEIA_ENTREGA = new Set(['DESLIGADO', 'RESCISAO', 'RESCISÃO', 'EXCLUIDO']);

/** Limite máximo defensivo para quantidades (espelha o legado). */
export const MAX_QUANTIDADE = 1_000_000;

export const RETURN_CONDITION_LABEL: Record<ReturnCondition, string> = {
  NOVO: 'Novo', BOM: 'Bom', USADO: 'Usado', DANIFICADO: 'Danificado', SEM_REUSO: 'Sem reúso',
};
export const RETURN_DESTINATION_LABEL: Record<ReturnDestination, string> = {
  ESTOQUE: 'Estoque', HIGIENIZACAO: 'Higienização', MANUTENCAO: 'Manutenção', BAIXA: 'Baixa', DESCARTE: 'Descarte',
};

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  ENTRADA: 'Entrada',
  AJUSTE_ENTRADA: 'Ajuste (+)',
  AJUSTE_SAIDA: 'Ajuste (−)',
  ENTREGA: 'Entrega',
  DEVOLUCAO: 'Devolução',
  ESTORNO_ENTREGA: 'Estorno de entrega',
  ESTORNO_DEVOLUCAO: 'Estorno de devolução',
};

/** Movimentos que somam saldo (entrada) vs. que subtraem (saída) — para exibição. */
export const MOVEMENT_IS_ENTRADA: Record<MovementType, boolean> = {
  ENTRADA: true, AJUSTE_ENTRADA: true, DEVOLUCAO: true, ESTORNO_ENTREGA: true,
  AJUSTE_SAIDA: false, ENTREGA: false, ESTORNO_DEVOLUCAO: false,
};

/** Rótulos pt-BR (exibição). */
export const DELIVERY_TYPE_LABEL: Record<DeliveryType, string> = {
  ADMISSAO: 'Admissão',
  RENOVACAO: 'Renovação',
  DESGASTE: 'Desgaste',
  TROCA_TAMANHO: 'Troca de tamanho',
  PERDA: 'Perda',
  DANIFICACAO: 'Danificação',
  MUDANCA_SETOR: 'Mudança de setor',
  EXTRAORDINARIA: 'Extraordinária',
  COMPRA: 'Compra',
};
