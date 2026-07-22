import { minimoEfetivo, statusEstoque } from './stockStatus';
import type { UnidadeRow, VarianteRow, SaldoRow, FardamentoRow, SaldoUnidade } from '../types/db.types';

/**
 * Compõe as linhas da tela Fardamentos a partir das variantes + saldos + unidades
 * (dados já carregados em lote — sem N+1). Puro e testável. Aplica o mínimo
 * efetivo (unidade → variante → 0) e o status por unidade.
 */
export function construirFardamentos(variantes: VarianteRow[], saldos: SaldoRow[], unidades: UnidadeRow[]): FardamentoRow[] {
  const nomeUnidade = new Map(unidades.map((u) => [u.id, u.nome]));
  const saldosPorVariante = new Map<string, SaldoRow[]>();
  for (const s of saldos) {
    const arr = saldosPorVariante.get(s.variante_id) ?? [];
    arr.push(s);
    saldosPorVariante.set(s.variante_id, arr);
  }

  return variantes.map((variante) => {
    const linhas = saldosPorVariante.get(variante.id) ?? [];
    const saldos: SaldoUnidade[] = linhas.map((s) => {
      const min = minimoEfetivo(s.estoque_minimo, variante.estoque_minimo_padrao);
      return {
        unidadeId: s.unidade_id,
        unidadeNome: nomeUnidade.get(s.unidade_id) ?? 'Local de estoque',
        quantidade: s.quantidade,
        minimoEfetivo: min,
        estoqueIdeal: s.estoque_ideal ?? null,
        status: statusEstoque(s.quantidade, min),
      };
    });
    const saldoTotal = saldos.reduce((acc, s) => acc + s.quantidade, 0);
    return {
      variante,
      categoriaNome: variante.modelo?.categoria?.nome ?? null,
      modeloNome: variante.modelo?.nome ?? null,
      tamanhoRotulo: variante.tamanho?.rotulo ?? null,
      saldoTotal,
      saldos,
      emAlerta: saldos.some((s) => s.status !== 'NORMAL'),
    };
  });
}
