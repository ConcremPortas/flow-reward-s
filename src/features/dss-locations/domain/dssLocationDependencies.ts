// Vínculos/cobertura dos locais de DSS — agregação EM LOTE (sem N+1). Puro.
//
// Relações diretas: funcionarios.local_dss_id, dss.local_dss_id. A presença é o
// array `participantes_ids` de cada DSS. A exclusão é bloqueada com vínculos
// (funcionários ou DSS).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DSS } from '@/hooks/useDSS';
import type { LocalDSS } from '@/hooks/useLocaisDSS';
import type { DssLocationUsage } from '../types/dss-location.types';

export interface DssLocationStats {
  funcionarios: number;
  ativos: number;
  inativos: number;
  dss: DSS[];
}

export interface DssLocationUsageMaps {
  porLocal: Map<string, DssLocationStats>;
  semLocal: number; // funcionários ativos sem local_dss_id
}

export function buildDssLocationUsageMaps(funcionarios: Funcionario[], dssRecords: DSS[]): DssLocationUsageMaps {
  const porLocal = new Map<string, DssLocationStats>();
  const ensure = (id: string) => {
    if (!porLocal.has(id)) porLocal.set(id, { funcionarios: 0, ativos: 0, inativos: 0, dss: [] });
    return porLocal.get(id)!;
  };

  let semLocal = 0;
  for (const f of funcionarios) {
    if (!f.local_dss_id) { if (f.ativo) semLocal += 1; continue; }
    const s = ensure(f.local_dss_id);
    s.funcionarios += 1;
    if (f.ativo) s.ativos += 1; else s.inativos += 1;
  }

  for (const d of dssRecords) {
    if (!d.local_dss_id) continue;
    ensure(d.local_dss_id).dss.push(d);
  }

  return { porLocal, semLocal };
}

export function usageFor(local: LocalDSS, maps: DssLocationUsageMaps): DssLocationUsage {
  const s = maps.porLocal.get(local.id) ?? { funcionarios: 0, ativos: 0, inativos: 0, dss: [] };
  const dssOrdenados = [...s.dss].sort((a, b) => (b.data_realizacao ?? '').localeCompare(a.data_realizacao ?? ''));
  const presencas = s.dss.reduce((acc, d) => acc + (d.participantes_ids?.length ?? 0), 0);
  const dssRealizados = s.dss.length;
  const presencaMedia = dssRealizados > 0 ? Math.round(presencas / dssRealizados) : 0;

  let participacaoMediaPct: number | null = null;
  if (dssRealizados > 0 && s.ativos > 0) {
    const soma = s.dss.reduce((acc, d) => acc + Math.min((d.participantes_ids?.length ?? 0) / s.ativos, 1), 0);
    participacaoMediaPct = Math.round((soma / dssRealizados) * 100);
  }

  return {
    funcionarios: s.funcionarios,
    funcionariosAtivos: s.ativos,
    funcionariosInativos: s.inativos,
    dssRealizados,
    presencas,
    presencaMedia,
    participacaoMediaPct,
    ultimaData: dssOrdenados[0]?.data_realizacao ?? null,
    ultimosDss: dssOrdenados.slice(0, 5).map(d => ({ id: d.id, titulo: d.titulo, data: d.data_realizacao, presentes: d.participantes_ids?.length ?? 0 })),
    emUso: s.funcionarios > 0 || dssRealizados > 0,
    temHistorico: dssRealizados > 0,
  };
}

/** Exclusão bloqueada com vínculos ativos (funcionários) ou histórico (DSS). */
export function hasActiveLinks(usage: DssLocationUsage): boolean {
  return usage.funcionarios > 0 || usage.dssRealizados > 0;
}
