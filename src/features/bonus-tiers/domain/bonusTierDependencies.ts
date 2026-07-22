// Vínculos/utilização das faixas — agregação EM LOTE (sem N+1). Puro.
//
// Relações reais: funcionários têm `faixa_id` (direto). Categorias e bases são
// INDIRETAS — derivadas dos funcionários que usam a faixa. Resultados históricos
// referenciam a faixa apenas pelo NOME (snapshot), então o vínculo histórico é
// por nome normalizado (melhor esforço).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Faixa } from '@/hooks/useFaixas';
import type { TierUsage } from '../types/bonus-tier.types';
import { normalizeStr } from './bonusTierPresentation';

export interface TierUsageMaps {
  funcionarios: Map<string, Set<string>>;
  categorias: Map<string, Set<string>>;
  bases: Map<string, Set<string>>;
  resultadosPorNome: Map<string, number>;
}

export function buildUsageMaps(funcionarios: Funcionario[], resultados: ResultadoPremiacao[]): TierUsageMaps {
  const funcionariosM = new Map<string, Set<string>>();
  const categoriasM = new Map<string, Set<string>>();
  const basesM = new Map<string, Set<string>>();

  for (const f of funcionarios) {
    if (!f.ativo || !f.faixa_id) continue;
    if (!funcionariosM.has(f.faixa_id)) { funcionariosM.set(f.faixa_id, new Set()); categoriasM.set(f.faixa_id, new Set()); basesM.set(f.faixa_id, new Set()); }
    funcionariosM.get(f.faixa_id)!.add(f.id);
    if (f.categoria_id) categoriasM.get(f.faixa_id)!.add(f.categoria_id);
    if (f.base_premiacao_id) basesM.get(f.faixa_id)!.add(f.base_premiacao_id);
  }

  const resultadosPorNome = new Map<string, number>();
  for (const r of resultados) {
    const key = normalizeStr(r.faixa);
    if (!key) continue;
    resultadosPorNome.set(key, (resultadosPorNome.get(key) ?? 0) + 1);
  }

  return { funcionarios: funcionariosM, categorias: categoriasM, bases: basesM, resultadosPorNome };
}

export function usageFor(faixa: Faixa, maps: TierUsageMaps): TierUsage {
  const funcionarios = maps.funcionarios.get(faixa.id)?.size ?? 0;
  return {
    funcionarios,
    categorias: maps.categorias.get(faixa.id)?.size ?? 0,
    bases: maps.bases.get(faixa.id)?.size ?? 0,
    resultadosHistoricos: maps.resultadosPorNome.get(normalizeStr(faixa.nome)) ?? 0,
    emUso: funcionarios > 0,
  };
}

/** A exclusão é SOFT (ativo=false) — não há bloqueio de FK (faixa_id vira null). */
export function hasActiveLinks(usage: TierUsage): boolean {
  return usage.funcionarios > 0;
}
