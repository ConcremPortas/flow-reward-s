// Utilização das fórmulas — agregação EM LOTE (sem N+1). Puro.
//
// Não há FK apontando para a fórmula. A "utilização" é derivada: funcionários
// ativos cuja combinação (categoria_id, base_premiacao_id) é atendida pela fórmula
// — a mesma chave que o motor usa para selecioná-la.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { FormulaUsage } from '../types/reward-formula.types';

const key = (categoriaId: string | null | undefined, baseId: string | null | undefined) =>
  `${categoriaId ?? ''}|${baseId ?? ''}`;

/** Map (categoria_id|base_premiacao_id) → nº de funcionários ativos. */
export function buildFormulaUsageMap(funcionarios: Funcionario[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const f of funcionarios) {
    if (!f.ativo) continue;
    const k = key(f.categoria_id, f.base_premiacao_id);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function usageFor(categoriaId: string | null, baseId: string | null, map: Map<string, number>): FormulaUsage {
  const funcionarios = (categoriaId && baseId) ? (map.get(key(categoriaId, baseId)) ?? 0) : 0;
  return { funcionarios, emUso: funcionarios > 0 };
}

/** Bloqueia exclusão quando a fórmula atende funcionários ativos. */
export function hasActiveLinks(usage: FormulaUsage): boolean {
  return usage.funcionarios > 0;
}
