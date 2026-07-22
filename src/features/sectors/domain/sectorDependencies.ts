// Vínculos/dependências do setor — agregação EM LOTE (sem N+1). Puro.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { SectorLinks } from '../types/sector.types';

interface ProducaoRow { setor_id?: string | null }
interface IndicadorRow { setor_id?: string | null }

/**
 * Constrói mapas de contagem por setor a partir das listas JÁ carregadas em
 * memória — uma passada por lista, nada de uma query por setor.
 * Funcionários: conta ativos vinculados por `setor_id` OU presentes em `setor_ids`
 * (cada funcionário conta no máximo uma vez por setor).
 */
export function buildDependencyMaps(
  funcionarios: Funcionario[],
  producao: ProducaoRow[],
  indicadores: IndicadorRow[],
): {
  funcionarios: Map<string, number>;
  producao: Map<string, number>;
  indicadores: Map<string, number>;
} {
  const func = new Map<string, Set<string>>();
  for (const f of funcionarios) {
    if (!f.ativo) continue;
    const setorIds = new Set<string>();
    if (f.setor_id) setorIds.add(f.setor_id);
    (f.setor_ids ?? []).forEach(id => setorIds.add(id));
    for (const sid of setorIds) {
      if (!func.has(sid)) func.set(sid, new Set());
      func.get(sid)!.add(f.id);
    }
  }
  const funcCount = new Map<string, number>();
  for (const [sid, set] of func) funcCount.set(sid, set.size);

  const count = (rows: { setor_id?: string | null }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) { if (r.setor_id) m.set(r.setor_id, (m.get(r.setor_id) ?? 0) + 1); }
    return m;
  };

  return { funcionarios: funcCount, producao: count(producao), indicadores: count(indicadores) };
}

export function linksFor(
  setorId: string,
  maps: ReturnType<typeof buildDependencyMaps>,
): SectorLinks {
  return {
    funcionarios: maps.funcionarios.get(setorId) ?? 0,
    producao: maps.producao.get(setorId) ?? 0,
    indicadores: maps.indicadores.get(setorId) ?? 0,
  };
}

export function hasBlockingDependencies(links: SectorLinks): boolean {
  // A exclusão é SOFT (ativo=false) — o banco não bloqueia. Ainda assim,
  // sinalizamos funcionários vinculados como impacto relevante à decisão.
  return links.funcionarios > 0;
}
