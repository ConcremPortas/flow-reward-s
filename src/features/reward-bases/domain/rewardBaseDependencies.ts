// Vínculos/utilização das bases — agregação EM LOTE (sem N+1). Puro.
//
// Relações diretas: funcionarios.base_premiacao_id, formulas_calculo.base_premiacao_id.
// Categorias são INDIRETAS (via funcionários e via fórmulas). Resultados históricos
// referenciam a base por base_premiacao_id (snapshot dos valores calculados).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { RewardBaseUsage } from '../types/reward-base.types';

export interface RewardBaseUsageMaps {
  funcionarios: Map<string, Set<string>>;
  categorias: Map<string, Set<string>>;                 // categoria_id distintos (indireto)
  categoriaNomes: Map<string, Map<string, number>>;     // base_id → (nome categoria → nº func.)
  formulas: Map<string, string[]>;                      // base_id → nomes de fórmulas (direto)
  resultados: Map<string, number>;                      // base_id → nº resultados históricos
}

export function buildRewardBaseUsageMaps(
  funcionarios: Funcionario[],
  formulas: FormulaCalculo[],
  resultados: ResultadoPremiacao[],
): RewardBaseUsageMaps {
  const funcionariosM = new Map<string, Set<string>>();
  const categoriasM = new Map<string, Set<string>>();
  const categoriaNomesM = new Map<string, Map<string, number>>();

  for (const f of funcionarios) {
    if (!f.ativo || !f.base_premiacao_id) continue;
    const id = f.base_premiacao_id;
    if (!funcionariosM.has(id)) { funcionariosM.set(id, new Set()); categoriasM.set(id, new Set()); categoriaNomesM.set(id, new Map()); }
    funcionariosM.get(id)!.add(f.id);
    if (f.categoria_id) categoriasM.get(id)!.add(f.categoria_id);
    const nomeCat = f.categoria?.nome;
    if (nomeCat) { const m = categoriaNomesM.get(id)!; m.set(nomeCat, (m.get(nomeCat) ?? 0) + 1); }
  }

  const formulasM = new Map<string, string[]>();
  for (const fm of formulas) {
    if (!fm.base_premiacao_id || !fm.ativo) continue;
    if (!formulasM.has(fm.base_premiacao_id)) formulasM.set(fm.base_premiacao_id, []);
    formulasM.get(fm.base_premiacao_id)!.push(fm.nome);
    // A fórmula também vincula a base à sua categoria (indireto).
    if (fm.categoria_id) {
      if (!categoriasM.has(fm.base_premiacao_id)) categoriasM.set(fm.base_premiacao_id, new Set());
      categoriasM.get(fm.base_premiacao_id)!.add(fm.categoria_id);
    }
  }

  const resultadosM = new Map<string, number>();
  for (const r of resultados) {
    if (!r.base_premiacao_id) continue;
    resultadosM.set(r.base_premiacao_id, (resultadosM.get(r.base_premiacao_id) ?? 0) + 1);
  }

  return { funcionarios: funcionariosM, categorias: categoriasM, categoriaNomes: categoriaNomesM, formulas: formulasM, resultados: resultadosM };
}

export function usageFor(base: BasePremiacao, maps: RewardBaseUsageMaps): RewardBaseUsage {
  const funcionarios = maps.funcionarios.get(base.id)?.size ?? 0;
  const resultadosHistoricos = maps.resultados.get(base.id) ?? 0;
  const formulasNomes = (maps.formulas.get(base.id) ?? []).slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const topCategorias = Array.from(maps.categoriaNomes.get(base.id)?.entries() ?? [])
    .map(([nome, n]) => ({ nome, funcionarios: n }))
    .sort((a, b) => b.funcionarios - a.funcionarios || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 6);
  return {
    funcionarios,
    formulas: formulasNomes.length,
    categorias: maps.categorias.get(base.id)?.size ?? 0,
    resultadosHistoricos,
    emUso: funcionarios > 0 || formulasNomes.length > 0,
    somenteHistorico: funcionarios === 0 && formulasNomes.length === 0 && resultadosHistoricos > 0,
    topCategorias,
    formulasNomes,
  };
}

/** Exclusão bloqueada com vínculos ATIVOS (funcionários ou fórmulas). Histórico não bloqueia. */
export function hasActiveLinks(usage: RewardBaseUsage): boolean {
  return usage.funcionarios > 0 || usage.formulas > 0;
}
