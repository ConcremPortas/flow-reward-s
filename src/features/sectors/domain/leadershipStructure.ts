// Agrupamento por supervisor para a visão Estrutura de Liderança — puro.
// Conta encarregados/funcionários por ID real (não por nome) para não duplicar.
import type { LeadershipGroupData, SectorRow } from '../types/sector.types';

const SEM_SUPERVISOR = 'Sem supervisor definido';

export function buildLeadershipGroups(rows: SectorRow[]): LeadershipGroupData[] {
  const map = new Map<string, SectorRow[]>();
  for (const r of rows) {
    const key = r.supervisorId ?? '∅';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const groups: LeadershipGroupData[] = [...map.entries()].map(([key, setores]) => {
    const encarregados = new Set(setores.map(s => s.encarregadoId).filter(Boolean) as string[]);
    const funcionariosVinculados = setores.reduce((s, r) => s + r.links.funcionarios, 0);
    return {
      supervisorId: key === '∅' ? null : key,
      supervisorNome: key === '∅' ? SEM_SUPERVISOR : (setores[0].supervisorNome ?? 'Supervisor'),
      setores: [...setores].sort((a, b) => a.nome.localeCompare(b.nome)),
      encarregadosUnicos: encarregados.size,
      funcionariosVinculados,
      comPendencia: setores.filter(s => s.status.status !== 'completo').length,
    };
  });

  // "Sem supervisor" por último; demais por nome.
  return groups.sort((a, b) => {
    if (a.supervisorId === null) return 1;
    if (b.supervisorId === null) return -1;
    return a.supervisorNome.localeCompare(b.supervisorNome);
  });
}

export interface LeadershipSummary {
  setores: number;
  supervisores: number;
  encarregados: number;
  completos: number;
  comPendenciaLideranca: number;
}

/** Métricas reais — supervisores/encarregados contados por ID único. */
export function computeLeadershipSummary(rows: SectorRow[]): LeadershipSummary {
  const supervisores = new Set(rows.map(r => r.supervisorId).filter(Boolean) as string[]);
  const encarregados = new Set(rows.map(r => r.encarregadoId).filter(Boolean) as string[]);
  return {
    setores: rows.length,
    supervisores: supervisores.size,
    encarregados: encarregados.size,
    completos: rows.filter(r => r.supervisorId && r.encarregadoId).length,
    comPendenciaLideranca: rows.filter(r => !r.supervisorId || !r.encarregadoId).length,
  };
}
