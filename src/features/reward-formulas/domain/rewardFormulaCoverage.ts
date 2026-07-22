// Matriz de cobertura Categoria × Base — puro. Uma célula por combinação.
//
// Estado observacional: sem_formula (0), configurada (1 válida), incompleta
// (1 inválida), duplicada (>1). NÃO marcamos "não aplicável" (não há regra real
// que defina combinações inaplicáveis — ausência ≠ inaplicável).
import type { RewardFormulaRow, CoverageCell, CoverageCellState } from '../types/reward-formula.types';

export interface CoverageAxis { id: string; nome: string }

export interface Coverage {
  categorias: CoverageAxis[];
  bases: CoverageAxis[];
  cells: Map<string, CoverageCell>; // key `${categoriaId}|${baseId}`
}

const cellKey = (categoriaId: string, baseId: string) => `${categoriaId}|${baseId}`;

export function buildCoverage(
  categorias: CoverageAxis[],
  bases: CoverageAxis[],
  formulas: RewardFormulaRow[],
): Coverage {
  const byCombo = new Map<string, RewardFormulaRow[]>();
  for (const f of formulas) {
    if (!f.categoriaId || !f.baseId) continue;
    const k = cellKey(f.categoriaId, f.baseId);
    if (!byCombo.has(k)) byCombo.set(k, []);
    byCombo.get(k)!.push(f);
  }

  const cells = new Map<string, CoverageCell>();
  for (const cat of categorias) {
    for (const base of bases) {
      const k = cellKey(cat.id, base.id);
      const matches = byCombo.get(k) ?? [];
      let state: CoverageCellState;
      if (matches.length === 0) state = 'sem_formula';
      else if (matches.length > 1) state = 'duplicada';
      else state = matches[0].validation.valid ? 'configurada' : 'incompleta';
      cells.set(k, { categoriaId: cat.id, baseId: base.id, state, formulaIds: matches.map(m => m.id) });
    }
  }
  return { categorias, bases, cells };
}

export function cellAt(coverage: Coverage, categoriaId: string, baseId: string): CoverageCell | undefined {
  return coverage.cells.get(cellKey(categoriaId, baseId));
}

export interface CoverageCounts { configuradas: number; incompletas: number; semFormula: number; duplicadas: number; total: number }

export function coverageCounts(coverage: Coverage): CoverageCounts {
  let configuradas = 0, incompletas = 0, semFormula = 0, duplicadas = 0;
  for (const c of coverage.cells.values()) {
    if (c.state === 'configurada') configuradas++;
    else if (c.state === 'incompleta') incompletas++;
    else if (c.state === 'sem_formula') semFormula++;
    else duplicadas++;
  }
  return { configuradas, incompletas, semFormula, duplicadas, total: coverage.cells.size };
}

export const COVERAGE_CELL_META: Record<CoverageCellState, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  configurada: { label: 'Configurada', variant: 'success' },
  incompleta: { label: 'Incompleta', variant: 'danger' },
  sem_formula: { label: 'Sem fórmula', variant: 'neutral' },
  duplicada: { label: 'Duplicada', variant: 'warning' },
};
