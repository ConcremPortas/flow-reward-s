// Participação em DSS — puro.
import type { DSS } from '@/hooks/useDSS';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { inCompetencia } from './dates';

/**
 * Participação média em DSS na competência.
 * Para cada evento: participantes ÷ funcionários vinculados ao local (limitado a 100%).
 * Retorna a média entre os eventos com base de vínculo, ou null se não houver.
 */
export function dssParticipacaoMedia(
  dss: DSS[],
  funcs: Funcionario[],
  comp: string,
): number | null {
  const eventos = dss.filter(d => inCompetencia(d.data_realizacao, comp));
  const taxas: number[] = [];
  for (const e of eventos) {
    const base = funcs.filter(f => f.local_dss_id === e.local_dss_id).length;
    if (base > 0) {
      const presentes = (e.participantes_ids || []).length;
      taxas.push(Math.min(presentes / base, 1));
    }
  }
  if (taxas.length === 0) return null;
  return Number(((taxas.reduce((a, b) => a + b, 0) / taxas.length) * 100).toFixed(1));
}

/** Participação (0..1) por local de DSS na competência. */
export function participacaoPorLocal(
  dss: DSS[],
  funcs: Funcionario[],
  comp: string,
): Map<string, number> {
  const baseByLocal = new Map<string, number>();
  funcs.forEach(f => {
    if (f.local_dss_id) baseByLocal.set(f.local_dss_id, (baseByLocal.get(f.local_dss_id) || 0) + 1);
  });
  const acc = new Map<string, { soma: number; n: number }>();
  dss.filter(d => inCompetencia(d.data_realizacao, comp)).forEach(e => {
    if (!e.local_dss_id) return;
    const base = baseByLocal.get(e.local_dss_id) || 0;
    if (base <= 0) return;
    const taxa = Math.min((e.participantes_ids || []).length / base, 1);
    const cur = acc.get(e.local_dss_id) || { soma: 0, n: 0 };
    cur.soma += taxa; cur.n += 1;
    acc.set(e.local_dss_id, cur);
  });
  const out = new Map<string, number>();
  for (const [k, v] of acc) out.set(k, v.n > 0 ? v.soma / v.n : 0);
  return out;
}

/** Participação média de DSS de um setor (média dos locais dos seus funcionários). */
export function dssParticipacaoSetor(
  localPart: Map<string, number>,
  setorFuncs: Funcionario[],
): number | null {
  const taxas = setorFuncs
    .map(f => (f.local_dss_id ? localPart.get(f.local_dss_id) : undefined))
    .filter((v): v is number => v != null);
  if (taxas.length === 0) return null;
  return Number(((taxas.reduce((a, b) => a + b, 0) / taxas.length) * 100).toFixed(1));
}
