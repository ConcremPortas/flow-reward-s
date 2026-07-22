import { StockDomainError, MAX_QUANTIDADE } from './domainConstants';

/**
 * Regras puras de saldo. Espelham o guard atômico do sistema original
 * (`changeBalance`: nunca permitir saldo negativo), sem tocar banco. A garantia
 * transacional/atômica real ficará na RPC Postgres; aqui é a regra de negócio.
 */

/** Valida que uma quantidade é inteiro positivo dentro do limite. */
export function assertQuantidadePositiva(qtd: number): void {
  if (!Number.isInteger(qtd)) throw new StockDomainError('QTD_INVALIDA', 'Informe uma quantidade inteira válida.');
  if (qtd <= 0) throw new StockDomainError('QTD_NAO_POSITIVA', 'A quantidade deve ser maior que zero.');
  if (qtd > MAX_QUANTIDADE) throw new StockDomainError('QTD_EXCEDE_LIMITE', 'Quantidade acima do limite permitido.');
}

/** Aplica um delta ao saldo. Bloqueia resultado negativo (regra inegociável). */
export function aplicarDelta(saldoAtual: number, delta: number): number {
  if (!Number.isInteger(saldoAtual) || !Number.isInteger(delta)) {
    throw new StockDomainError('SALDO_INVALIDO', 'Saldo e movimento devem ser inteiros.');
  }
  const novo = saldoAtual + delta;
  if (novo < 0) throw new StockDomainError('SALDO_NEGATIVO', 'Operação bloqueada: o estoque não pode ficar negativo.');
  return novo;
}

/** True se o saldo atual comporta a saída da quantidade pedida. */
export function podeAtender(saldoAtual: number, quantidade: number): boolean {
  return saldoAtual >= quantidade;
}

/** Baixa (saída) de saldo com validação. Retorna o novo saldo. */
export function baixarSaldo(saldoAtual: number, quantidade: number): number {
  assertQuantidadePositiva(quantidade);
  if (!podeAtender(saldoAtual, quantidade)) {
    throw new StockDomainError('SALDO_INSUFICIENTE', `Estoque insuficiente. Disponível: ${saldoAtual} unidade(s).`);
  }
  return aplicarDelta(saldoAtual, -quantidade);
}

/** Entrada (incremento) de saldo com validação. Retorna o novo saldo. */
export function incrementarSaldo(saldoAtual: number, quantidade: number): number {
  assertQuantidadePositiva(quantidade);
  return aplicarDelta(saldoAtual, quantidade);
}
