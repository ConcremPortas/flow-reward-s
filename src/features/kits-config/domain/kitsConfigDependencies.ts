// Utilização e retroatividade — agregação EM LOTE (sem N+1). Puro.
//
// Não há FK resultado→config. A utilização é derivada: para cada competência já
// processada (distinta em resultados de kits), qual config a governa (seleção por
// vigência). Isso marca as configs efetivamente aplicadas.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { selectConfigForCompetencia, type HasVigencia } from './kitsConfigSelection';
import type { KitsConfigUsage } from '../types/kits-config.types';

export interface CompetenciaStats { competencias: Set<string>; resultados: number }

/** Competências de kits já processadas → { comp: nº resultados }. */
export function competenciasProcessadas(resultados: ResultadoPremiacao[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of resultados) {
    if (r.valor_kits == null) continue; // só resultados de kits
    const comp = (r.mes_competencia ?? '').slice(0, 7);
    if (!comp) continue;
    m.set(comp, (m.get(comp) ?? 0) + 1);
  }
  return m;
}

/** Map configId → utilização (competências/resultados governados por ela). */
export function buildConfigUsage<T extends HasVigencia & { id: string }>(
  configs: T[],
  resultados: ResultadoPremiacao[],
): Map<string, KitsConfigUsage> {
  const compMap = competenciasProcessadas(resultados);
  const acc = new Map<string, CompetenciaStats>();
  for (const [comp, n] of compMap) {
    const cfg = selectConfigForCompetencia(configs, comp);
    if (!cfg) continue;
    if (!acc.has(cfg.id)) acc.set(cfg.id, { competencias: new Set(), resultados: 0 });
    const s = acc.get(cfg.id)!;
    s.competencias.add(comp);
    s.resultados += n;
  }
  const out = new Map<string, KitsConfigUsage>();
  for (const c of configs) {
    const s = acc.get(c.id);
    out.set(c.id, { competencias: s?.competencias.size ?? 0, resultados: s?.resultados ?? 0, utilizada: (s?.competencias.size ?? 0) > 0 });
  }
  return out;
}

/** Competências já processadas afetadas por uma vigência retroativa (≥ novaVigência). */
export function competenciasAfetadasPorRetroatividade(resultados: ResultadoPremiacao[], novaVigencia: string): { competencias: string[]; resultados: number } {
  const compMap = competenciasProcessadas(resultados);
  let total = 0;
  const comps: string[] = [];
  for (const [comp, n] of compMap) {
    if (comp >= novaVigencia.slice(0, 7)) { comps.push(comp); total += n; }
  }
  comps.sort();
  return { competencias: comps, resultados: total };
}
