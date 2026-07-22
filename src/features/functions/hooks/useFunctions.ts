import { useMemo } from 'react';
import { useFuncoes } from '@/hooks/useFuncoes';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { buildFunctionUsageMaps, usageFor } from '../domain/functionDependencies';
import { analyzeFunctionName } from '../domain/functionNameAnalysis';
import { buildSimilarityMatches, buildSimilarityGroups, classifyPair } from '../domain/functionSimilarity';
import { getFunctionRegistrationStatus } from '../domain/functionRegistrationStatus';
import { normalizeStr } from '../domain/functionNameNormalization';
import type { FunctionRow, SimilarityGroup } from '../types/function.types';

export interface SetorOption { id: string; nome: string }

/**
 * Composição das fontes da Central de Funções. Constrói as linhas enriquecidas
 * (qualidade do nome + utilização + similaridade + situação) uma vez, com
 * vínculos agregados em lote (sem N+1). Reexpõe create/update/delete (delete é
 * soft). Não altera o banco nem o motor de premiação.
 */
export function useFunctions() {
  const { funcoes, loading, createFuncao, updateFuncao, deleteFuncao, refetch } = useFuncoes();
  const { funcionarios } = useFuncionarios();
  const { resultados } = useResultadosPremiacao();

  const maps = useMemo(() => buildFunctionUsageMaps(funcionarios, resultados), [funcionarios, resultados]);

  // Lookup de utilização por id (para a análise de similaridade e grupos).
  const usageById = useMemo(() => {
    const m = new Map<string, ReturnType<typeof usageFor>>();
    for (const f of funcoes) m.set(f.id, usageFor(f, maps));
    return m;
  }, [funcoes, maps]);

  const simItems = useMemo(() => funcoes.map(f => ({ id: f.id, nome: f.nome })), [funcoes]);
  const usageLookup = useMemo(
    () => (id: string) => {
      const u = usageById.get(id);
      return { funcionarios: u?.funcionarios ?? 0, setores: u?.setores ?? 0 };
    },
    [usageById],
  );

  const matches = useMemo(() => buildSimilarityMatches(simItems, usageLookup), [simItems, usageLookup]);
  const similarityGroups = useMemo<SimilarityGroup[]>(
    () => buildSimilarityGroups(simItems, usageLookup),
    [simItems, usageLookup],
  );

  // Contagem por nome normalizado (duplicidade literal app-level).
  const nomeCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of funcoes) m.set(normalizeStr(f.nome), (m.get(normalizeStr(f.nome)) ?? 0) + 1);
    return m;
  }, [funcoes]);

  const rows = useMemo<FunctionRow[]>(() => funcoes.map((f) => {
    const usage = usageById.get(f.id)!;
    const quality = analyzeFunctionName(f.nome);
    const similar = matches.get(f.id) ?? [];
    const duplicadoLiteral = (nomeCount.get(normalizeStr(f.nome)) ?? 0) > 1;
    return {
      id: f.id, nome: f.nome, descricao: f.descricao ?? null, nivelHierarquico: f.nivel_hierarquico ?? null,
      quality, usage, similar, duplicadoLiteral,
      status: getFunctionRegistrationStatus({ quality, similar, duplicadoLiteral }),
      setorIds: Array.from(maps.setores.get(f.id) ?? []),
    } satisfies FunctionRow;
  }), [funcoes, usageById, matches, nomeCount, maps]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  // Opções de setor para o filtro — derivadas dos funcionários (id + nome).
  const setorOptions = useMemo<SetorOption[]>(() => {
    const m = new Map<string, string>();
    for (const f of funcionarios) {
      if (f.setor_id && f.setor?.nome) m.set(f.setor_id, f.setor.nome);
    }
    return Array.from(m.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [funcionarios]);

  // Totais GLOBAIS (distintos) das relações — união dos conjuntos por função.
  const relationsTotals = useMemo(() => {
    const funcs = new Set<string>(), sets = new Set<string>(), emps = new Set<string>();
    for (const s of maps.funcionarios.values()) s.forEach(x => funcs.add(x));
    for (const s of maps.setores.values()) s.forEach(x => sets.add(x));
    for (const s of maps.empresas.values()) s.forEach(x => emps.add(x));
    return { funcionarios: funcs.size, setores: sets.size, empresas: emps.size };
  }, [maps]);

  /** Duplicidade app-level (não há constraint no banco): mesmo nome normalizado. */
  const findDuplicate = (nome: string, exceptId?: string): FunctionRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeStr(r.nome) === normalizeStr(nome));

  /** Função existente com nome SEMELHANTE (não idêntico) — para aviso ao digitar. */
  const findSimilar = (nome: string, exceptId?: string): { row: FunctionRow; diffs: string[]; confidence: 'high' | 'medium' } | undefined => {
    const key = normalizeStr(nome);
    if (!key) return undefined;
    let best: { row: FunctionRow; diffs: string[]; confidence: 'high' | 'medium' } | undefined;
    for (const r of rows) {
      if (r.id === exceptId) continue;
      if (normalizeStr(r.nome) === key) continue; // duplicidade exata é tratada à parte
      const cls = classifyPair(nome, r.nome);
      if (!cls) continue;
      if (!best || (best.confidence === 'medium' && cls.confidence === 'high')) {
        best = { row: r, diffs: cls.diffs, confidence: cls.confidence };
        if (cls.confidence === 'high') break;
      }
    }
    return best;
  };

  return {
    rows, rowById, similarityGroups, setorOptions, relationsTotals, loading,
    createFuncao, updateFuncao, deleteFuncao, refetch, findDuplicate, findSimilar,
  };
}

export type UseFunctionsReturn = ReturnType<typeof useFunctions>;
