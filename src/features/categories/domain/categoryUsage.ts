// Utilização/vínculos das categorias — agregação EM LOTE (sem N+1). Puro.
//
// Relações diretas: funcionarios.categoria_id, faixas.categoria_id,
// formulas_calculo.categoria_id. Bases/setores são INDIRETOS (via funcionários).
// Resultados históricos referenciam a categoria pelo NOME (snapshot).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Faixa } from '@/hooks/useFaixas';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Categoria } from '@/hooks/useCategorias';
import type { CategoryUsage, CategoryUtilizacao, CategoryFaixaRef } from '../types/category.types';
import { normalizeForDuplicate } from './categoryValidation';

/**
 * Categorias premiáveis por NOME. Espelha a lista textual usada na feature
 * rewards-processing (`CATEGORIAS_PREMIAVEIS`) — apenas OBSERVACIONAL, para
 * exibição/alerta. NÃO é a fonte da regra e não deve ser alterada por aqui.
 */
export const CATEGORIAS_PREMIAVEIS_NOMES = ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'];

export function isPremiavelPorNome(nome: string): boolean {
  return CATEGORIAS_PREMIAVEIS_NOMES.includes((nome ?? '').trim().toUpperCase());
}

export interface CategoryUsageMaps {
  funcionarios: Map<string, Set<string>>;
  bases: Map<string, Map<string, number>>;   // categoria_id → (nome da base → nº func.)
  setores: Map<string, Map<string, number>>; // categoria_id → (nome do setor → nº func.)
  faixas: Map<string, CategoryFaixaRef[]>;    // categoria_id → faixas (direto)
  formulas: Map<string, string[]>;            // categoria_id → nomes de fórmulas (direto)
  resultadosPorNome: Map<string, number>;     // nome normalizado → nº resultados
}

export function buildCategoryUsageMaps(
  funcionarios: Funcionario[],
  faixas: Faixa[],
  formulas: FormulaCalculo[],
  resultados: ResultadoPremiacao[],
): CategoryUsageMaps {
  const funcionariosM = new Map<string, Set<string>>();
  const basesM = new Map<string, Map<string, number>>();
  const setoresM = new Map<string, Map<string, number>>();

  const bump = (m: Map<string, Map<string, number>>, id: string, nome?: string) => {
    if (!nome) return;
    if (!m.has(id)) m.set(id, new Map());
    const inner = m.get(id)!;
    inner.set(nome, (inner.get(nome) ?? 0) + 1);
  };

  for (const f of funcionarios) {
    if (!f.ativo || !f.categoria_id) continue;
    const id = f.categoria_id;
    if (!funcionariosM.has(id)) funcionariosM.set(id, new Set());
    funcionariosM.get(id)!.add(f.id);
    bump(basesM, id, f.base_premiacao?.nome);
    bump(setoresM, id, f.setor?.nome);
  }

  const faixasM = new Map<string, CategoryFaixaRef[]>();
  for (const fx of faixas) {
    if (!fx.categoria_id) continue;
    if (!faixasM.has(fx.categoria_id)) faixasM.set(fx.categoria_id, []);
    faixasM.get(fx.categoria_id)!.push({ id: fx.id, nome: fx.nome, valor: fx.valor });
  }

  const formulasM = new Map<string, string[]>();
  for (const fm of formulas) {
    if (!fm.categoria_id || !fm.ativo) continue;
    if (!formulasM.has(fm.categoria_id)) formulasM.set(fm.categoria_id, []);
    formulasM.get(fm.categoria_id)!.push(fm.nome);
  }

  const resultadosPorNome = new Map<string, number>();
  for (const r of resultados) {
    const key = normalizeForDuplicate(r.categoria);
    if (!key) continue;
    resultadosPorNome.set(key, (resultadosPorNome.get(key) ?? 0) + 1);
  }

  return { funcionarios: funcionariosM, bases: basesM, setores: setoresM, faixas: faixasM, formulas: formulasM, resultadosPorNome };
}

function top(m: Map<string, number> | undefined) {
  return Array.from(m?.entries() ?? [])
    .map(([nome, funcionarios]) => ({ nome, funcionarios }))
    .sort((a, b) => b.funcionarios - a.funcionarios || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 6);
}

export function usageFor(categoria: Categoria, maps: CategoryUsageMaps): CategoryUsage {
  const funcionarios = maps.funcionarios.get(categoria.id)?.size ?? 0;
  const faixasRef = (maps.faixas.get(categoria.id) ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const formulasNomes = (maps.formulas.get(categoria.id) ?? []).slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const resultadosHistoricos = maps.resultadosPorNome.get(normalizeForDuplicate(categoria.nome)) ?? 0;
  const premiavelPorNome = isPremiavelPorNome(categoria.nome);
  const topBases = top(maps.bases.get(categoria.id));
  const topSetores = top(maps.setores.get(categoria.id));

  return {
    funcionarios,
    faixas: faixasRef.length,
    formulas: formulasNomes.length,
    basesIndiretas: maps.bases.get(categoria.id)?.size ?? 0,
    setoresIndiretos: maps.setores.get(categoria.id)?.size ?? 0,
    resultadosHistoricos,
    emUso: funcionarios > 0,
    somenteHistorico: funcionarios === 0 && resultadosHistoricos > 0,
    premiavelPorNome,
    usadaEmPremiacao: premiavelPorNome || faixasRef.length > 0 || formulasNomes.length > 0,
    faixasRef,
    formulasNomes,
    topBases,
    topSetores,
  };
}

/** Estado derivado de utilização (não persistido). */
export function deriveUtilizacao(usage: CategoryUsage): CategoryUtilizacao {
  if (usage.emUso) return 'em_uso';
  if (usage.somenteHistorico) return 'uso_historico';
  return 'sem_vinculo';
}

export const UTILIZACAO_META: Record<CategoryUtilizacao, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  em_uso: { label: 'Em uso', variant: 'success' },
  uso_historico: { label: 'Uso histórico', variant: 'warning' },
  sem_vinculo: { label: 'Sem vínculo', variant: 'neutral' },
};
