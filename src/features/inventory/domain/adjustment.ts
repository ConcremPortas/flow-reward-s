import { StockDomainError, MAX_QUANTIDADE } from './domainConstants';
import type { AdjustmentResult } from '../types/inventory.types';

/**
 * REGRA NOVA (corrige o bug legado do ajuste multiunidade).
 *
 * O ajuste é SEMPRE por variante + unidade EXPLÍCITA. A diferença é calculada
 * SOMENTE sobre o saldo da unidade informada — nunca sobre o saldo agregado de
 * todas as unidades (comportamento legado caracterizado como bug). O saldo novo
 * nunca pode ser negativo.
 *
 * @param saldoAtualUnidade saldo atual NA UNIDADE (não a soma entre unidades)
 * @param saldoContado saldo físico contado NA UNIDADE
 */
export function calcularAjuste(saldoAtualUnidade: number, saldoContado: number): AdjustmentResult {
  if (!Number.isInteger(saldoContado)) throw new StockDomainError('AJUSTE_QTD_INVALIDA', 'Informe uma quantidade inteira válida.');
  if (saldoContado < 0) throw new StockDomainError('AJUSTE_NEGATIVO', 'A quantidade não pode ser negativa.');
  if (saldoContado > MAX_QUANTIDADE) throw new StockDomainError('AJUSTE_EXCEDE_LIMITE', 'Quantidade acima do limite permitido.');
  if (!Number.isInteger(saldoAtualUnidade) || saldoAtualUnidade < 0) throw new StockDomainError('SALDO_INVALIDO', 'Saldo atual inválido.');
  if (saldoContado === saldoAtualUnidade) throw new StockDomainError('AJUSTE_SEM_ALTERACAO', 'A nova quantidade é igual ao saldo atual.');

  const diferenca = saldoContado - saldoAtualUnidade;
  const direcao = diferenca > 0 ? 'IN' : 'OUT';
  const tipo = diferenca > 0 ? 'AJUSTE_ENTRADA' : 'AJUSTE_SAIDA';

  return { saldoAnterior: saldoAtualUnidade, saldoNovo: saldoContado, diferenca, direcao, tipo };
}
