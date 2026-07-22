// Vínculos/utilização das funções — agregação EM LOTE (sem N+1). Puro.
//
// Relação real: funcionários têm `funcao_id` (direto, FK → concremrh_funcoes).
// Setores, empresas e categorias são INDIRETOS — derivados dos funcionários que
// usam a função. Resultados históricos referenciam a função pelo NOME (snapshot),
// então o vínculo histórico é por nome normalizado (melhor esforço).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Funcao } from '@/hooks/useFuncoes';
import type { FunctionUsage } from '../types/function.types';
import { normalizeStr } from './functionNameNormalization';

export interface FunctionUsageMaps {
  funcionarios: Map<string, Set<string>>;
  setores: Map<string, Set<string>>;
  empresas: Map<string, Set<string>>;
  categorias: Map<string, Set<string>>;
  setorNomes: Map<string, Map<string, number>>; // funcao_id → (nome do setor → nº de funcionários)
  resultadosPorNome: Map<string, number>;
}

function ensure(id: string, maps: FunctionUsageMaps) {
  if (!maps.funcionarios.has(id)) {
    maps.funcionarios.set(id, new Set());
    maps.setores.set(id, new Set());
    maps.empresas.set(id, new Set());
    maps.categorias.set(id, new Set());
    maps.setorNomes.set(id, new Map());
  }
}

export function buildFunctionUsageMaps(funcionarios: Funcionario[], resultados: ResultadoPremiacao[]): FunctionUsageMaps {
  const maps: FunctionUsageMaps = {
    funcionarios: new Map(), setores: new Map(), empresas: new Map(),
    categorias: new Map(), setorNomes: new Map(), resultadosPorNome: new Map(),
  };

  for (const f of funcionarios) {
    if (!f.ativo || !f.funcao_id) continue;
    const id = f.funcao_id;
    ensure(id, maps);
    maps.funcionarios.get(id)!.add(f.id);
    if (f.empresa_id) maps.empresas.get(id)!.add(f.empresa_id);
    if (f.categoria_id) maps.categorias.get(id)!.add(f.categoria_id);

    // Setores: setor_id principal + setor_ids (múltiplos), quando presentes.
    const setorIds = new Set<string>();
    if (f.setor_id) setorIds.add(f.setor_id);
    for (const sid of f.setor_ids ?? []) setorIds.add(sid);
    setorIds.forEach(sid => maps.setores.get(id)!.add(sid));

    // Nome do setor (apenas o principal está no join) — para "principais setores".
    const nomeSetor = f.setor?.nome;
    if (nomeSetor) {
      const m = maps.setorNomes.get(id)!;
      m.set(nomeSetor, (m.get(nomeSetor) ?? 0) + 1);
    }
  }

  for (const r of resultados) {
    const key = normalizeStr(r.funcao);
    if (!key) continue;
    maps.resultadosPorNome.set(key, (maps.resultadosPorNome.get(key) ?? 0) + 1);
  }

  return maps;
}

export function usageFor(funcao: Funcao, maps: FunctionUsageMaps): FunctionUsage {
  const funcionarios = maps.funcionarios.get(funcao.id)?.size ?? 0;
  const resultadosHistoricos = maps.resultadosPorNome.get(normalizeStr(funcao.nome)) ?? 0;
  const topSetores = Array.from(maps.setorNomes.get(funcao.id)?.entries() ?? [])
    .map(([nome, n]) => ({ nome, funcionarios: n }))
    .sort((a, b) => b.funcionarios - a.funcionarios || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 5);
  return {
    funcionarios,
    setores: maps.setores.get(funcao.id)?.size ?? 0,
    empresas: maps.empresas.get(funcao.id)?.size ?? 0,
    categorias: maps.categorias.get(funcao.id)?.size ?? 0,
    resultadosHistoricos,
    emUso: funcionarios > 0,
    somenteHistorico: funcionarios === 0 && resultadosHistoricos > 0,
    topSetores,
  };
}

/**
 * Há vínculos ATIVOS que impedem a exclusão? A exclusão de função só é liberada
 * quando não há funcionários vinculados (regra do domínio, alinhada ao cadastro
 * de cargos). Histórico não bloqueia (mas é exibido como impacto).
 */
export function hasActiveLinks(usage: FunctionUsage): boolean {
  return usage.funcionarios > 0;
}
