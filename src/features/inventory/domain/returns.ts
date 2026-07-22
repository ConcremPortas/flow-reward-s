import { StockDomainError, RESTOCK_CONDITIONS } from './domainConstants';
import type { ReturnCondition, ReturnDestination } from '../types/inventory.types';

/**
 * Regras puras de devolução. Comportamento PRESERVADO do sistema original:
 *  - disponível para devolução = entregue − devolvido (ativo);
 *  - re-estoca SOMENTE quando destino=ESTOQUE e condição ∈ {NOVO, BOM, USADO}.
 */

/** Quantidade ainda passível de devolução para uma (entrega, variante). */
export function disponivelParaDevolver(entregue: number, devolvidoAtivo: number): number {
  return Math.max(0, entregue - devolvidoAtivo);
}

/** Valida a quantidade de uma devolução contra o disponível. */
export function validarQuantidadeDevolucao(quantidade: number, disponivel: number): void {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new StockDomainError('DEVOLUCAO_QTD_INVALIDA', 'Quantidade deve ser maior que zero.');
  }
  if (quantidade > disponivel) {
    throw new StockDomainError('DEVOLUCAO_QTD_MAIOR', `Quantidade maior que a quantidade em posse. Disponível para devolução: ${disponivel}.`);
  }
}

/** Regra de re-estocagem: só volta ao saldo se destino=ESTOQUE e condição reaproveitável. */
export function deveReestocar(destino: ReturnDestination, condicao: ReturnCondition): boolean {
  return destino === 'ESTOQUE' && RESTOCK_CONDITIONS.includes(condicao);
}
